import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import Stripe from 'stripe'
import productRoutes from './routes/productRoutes.js'
import { PrismaClient } from '@prisma/client'
import {
  sendCustomerOrderEmail,
  sendInternalOrderNotification,
} from './utils/orderEmails.js'
import {
  clearAdminSession,
  clearSessionCookie,
  createAdminSession,
  getAuthStatus,
  getSessionToken,
  isAdminConfigured,
  requireAdmin,
  setSessionCookie,
  verifyPassword,
} from './utils/adminAuth.js'

dotenv.config()

const app = express()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const prisma = new PrismaClient()
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET
const SHIPPING_COUNTRIES = ['US']
const FRONTEND_URLS = [
  process.env.CLIENT_URL,
  ...(process.env.FRONTEND_URLS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]
const allowedOrigins = new Set(FRONTEND_URLS.filter(Boolean))

async function getStoreSettings() {
  const existingSettings = await prisma.storeSettings.findUnique({
    where: { id: 1 },
  })

  if (existingSettings) {
    return existingSettings
  }

  return prisma.storeSettings.create({
    data: {
      id: 1,
      standardShippingRate: 6.95,
      heavyShippingRate: 12.95,
      priorityShippingSurcharge: 6.0,
    },
  })
}

function getShippingProfileRatesCents(settings) {
  return {
    free: 0,
    standard: Math.max(0, Math.round(Number(settings.standardShippingRate) * 100)),
    heavy: Math.max(0, Math.round(Number(settings.heavyShippingRate) * 100)),
  }
}

function getProductShippingRateCents(product, settings) {
  const shippingProfileRatesCents = getShippingProfileRatesCents(settings)

  if (
    product.shippingCustomAmount !== null &&
    product.shippingCustomAmount !== undefined &&
    product.shippingCustomAmount !== ''
  ) {
    return Math.max(0, Math.round(Number(product.shippingCustomAmount) * 100))
  }

  return shippingProfileRatesCents[product.shippingProfile] ?? shippingProfileRatesCents.standard
}

function getStandardShippingCents(items, productMap, settings) {
  return items.reduce((total, item) => {
    const product = productMap.get(item.id)
    return total + getProductShippingRateCents(product, settings) * item.quantity
  }, 0)
}

function buildShippingOptions(standardShippingCents, settings) {
  const standardLabel = standardShippingCents === 0 ? 'Free shipping' : 'Standard shipping'
  const priorityShippingAmount =
    standardShippingCents + Math.max(0, Math.round(Number(settings.priorityShippingSurcharge) * 100))

  return [
    {
      shipping_rate_data: {
        type: 'fixed_amount',
        display_name: standardLabel,
        fixed_amount: {
          amount: standardShippingCents,
          currency: 'usd',
        },
        delivery_estimate: {
          minimum: {
            unit: 'business_day',
            value: 4,
          },
          maximum: {
            unit: 'business_day',
            value: 7,
          },
        },
        tax_behavior: 'exclusive',
      },
    },
    {
      shipping_rate_data: {
        type: 'fixed_amount',
        display_name: 'Priority shipping',
        fixed_amount: {
          amount: priorityShippingAmount,
          currency: 'usd',
        },
        delivery_estimate: {
          minimum: {
            unit: 'business_day',
            value: 2,
          },
          maximum: {
            unit: 'business_day',
            value: 3,
          },
        },
        tax_behavior: 'exclusive',
      },
    },
  ]
}

function getOrderDetailsFromSession(session) {
  const collectedShipping = session?.collected_information?.shipping_details
  const shipping = collectedShipping || session?.shipping_details
  const address = shipping?.address || session?.customer_details?.address || {}

  return {
    customerName:
      shipping?.name ||
      session?.customer_details?.name ||
      session?.customer_details?.individual_name ||
      null,
    customerEmail: session?.customer_details?.email || session?.customer_email || null,
    shippingLine1: address.line1 || null,
    shippingLine2: address.line2 || null,
    shippingCity: address.city || null,
    shippingState: address.state || null,
    shippingPostalCode: address.postal_code || null,
    shippingCountry: address.country || null,
  }
}

function buildOrderAdminUpdateData(currentOrder, updates) {
  const nextStatus = updates.status || currentOrder.status
  const data = {
    status: nextStatus,
    trackingNumber: updates.trackingNumber?.trim() || null,
    adminNotes: updates.adminNotes?.trim() || null,
  }

  if (nextStatus === 'fulfilled' && !currentOrder.fulfilledAt) {
    data.fulfilledAt = new Date()
  }

  if (nextStatus === 'shipped') {
    data.fulfilledAt = currentOrder.fulfilledAt || new Date()
    if (!currentOrder.shippedAt) {
      data.shippedAt = new Date()
    }
  }

  if (nextStatus === 'new') {
    data.fulfilledAt = null
    data.shippedAt = null
    data.trackingNumber = updates.trackingNumber?.trim() || null
  }

  return data
}

function getStartOfDay(date) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  return start
}

function getStartOfWeek(date) {
  const start = getStartOfDay(date)
  const day = start.getDay()
  const diff = day === 0 ? 6 : day - 1
  start.setDate(start.getDate() - diff)
  return start
}

function getStartOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function buildRecentSalesSeries(orders, days = 7) {
  const today = getStartOfDay(new Date())
  const points = []

  for (let index = days - 1; index >= 0; index -= 1) {
    const currentDay = new Date(today)
    currentDay.setDate(today.getDate() - index)
    const nextDay = new Date(currentDay)
    nextDay.setDate(currentDay.getDate() + 1)

    const total = orders.reduce((sum, order) => {
      const createdAt = new Date(order.createdAt)
      return createdAt >= currentDay && createdAt < nextDay ? sum + Number(order.total || 0) : sum
    }, 0)

    points.push({
      label: currentDay.toLocaleDateString('en-US', { weekday: 'short' }),
      date: currentDay.toISOString(),
      total: Number(total.toFixed(2)),
    })
  }

  return points
}

function buildDashboardMetrics(orders) {
  const now = new Date()
  const startOfWeek = getStartOfWeek(now)
  const startOfMonth = getStartOfMonth(now)
  const totalOrders = orders.length
  const grossSales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0)
  const salesThisWeek = orders.reduce((sum, order) => {
    return new Date(order.createdAt) >= startOfWeek ? sum + Number(order.total || 0) : sum
  }, 0)
  const salesThisMonth = orders.reduce((sum, order) => {
    return new Date(order.createdAt) >= startOfMonth ? sum + Number(order.total || 0) : sum
  }, 0)
  const averageOrderValue = totalOrders > 0 ? grossSales / totalOrders : 0
  const statusCounts = orders.reduce(
    (counts, order) => {
      const key = order.status || 'new'
      counts[key] = (counts[key] || 0) + 1
      return counts
    },
    { new: 0, fulfilled: 0, shipped: 0 }
  )

  const productRollup = new Map()

  for (const order of orders) {
    for (const item of order.items || []) {
      const key = item.productId || item.name
      const existing = productRollup.get(key) || {
        productId: item.productId || null,
        name: item.name,
        category: item.category || 'Uncategorized',
        quantitySold: 0,
        revenue: 0,
      }

      existing.quantitySold += Number(item.quantity || 0)
      existing.revenue += Number(item.price || 0) * Number(item.quantity || 0)
      productRollup.set(key, existing)
    }
  }

  const topProducts = [...productRollup.values()]
    .sort((a, b) => {
      if (b.quantitySold !== a.quantitySold) {
        return b.quantitySold - a.quantitySold
      }

      return b.revenue - a.revenue
    })
    .slice(0, 5)
    .map((product) => ({
      ...product,
      revenue: Number(product.revenue.toFixed(2)),
    }))

  return {
    grossSales: Number(grossSales.toFixed(2)),
    totalOrders,
    averageOrderValue: Number(averageOrderValue.toFixed(2)),
    salesThisWeek: Number(salesThisWeek.toFixed(2)),
    salesThisMonth: Number(salesThisMonth.toFixed(2)),
    statusCounts,
    recentSales: buildRecentSalesSeries(orders, 7),
    topProducts,
  }
}

function serializeCartReference(items) {
  return items
    .map((item) => `${item.id}:${item.variantId || 0}:${item.quantity}`)
    .join(',')
}

function parseCartReference(reference = '') {
  return reference
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const parts = entry.split(':')

      // Older orders used the "id:quantity" format (no variants).
      if (parts.length === 2) {
        return {
          id: Number(parts[0]),
          variantId: null,
          quantity: Number(parts[1]),
        }
      }

      const [id, variantId, quantity] = parts
      return {
        id: Number(id),
        variantId: Number(variantId) > 0 ? Number(variantId) : null,
        quantity: Number(quantity),
      }
    })
    .filter((item) => Number.isInteger(item.id) && item.id > 0 && Number.isInteger(item.quantity) && item.quantity > 0)
}

async function createOrderRecord({
  normalizedItems,
  chargedTotal,
  checkoutSessionId = null,
  orderDetails,
}) {
  return prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: {
        id: {
          in: normalizedItems.map((item) => item.id),
        },
      },
      include: { variants: true },
    })
    const productMap = new Map(products.map((product) => [product.id, product]))

    // Resolve each purchased line to its product and (if any) chosen variant.
    const resolvedItems = normalizedItems.map((item) => {
      const product = productMap.get(item.id)

      if (!product) {
        throw new Error('One of the purchased products no longer exists.')
      }

      if (item.quantity <= 0) {
        throw new Error('Invalid purchase quantity.')
      }

      const variant = item.variantId
        ? (product.variants || []).find((v) => v.id === item.variantId)
        : null

      if (item.variantId && !variant) {
        throw new Error(`A size for ${product.name} is no longer available.`)
      }

      const available = variant ? variant.quantity : product.quantity
      if (available < item.quantity) {
        throw new Error(`${product.name} is no longer available in that quantity.`)
      }

      return { item, product, variant }
    })

    for (const { item, product, variant } of resolvedItems) {
      if (variant) {
        const variantUpdate = await tx.productVariant.updateMany({
          where: { id: variant.id, quantity: { gte: item.quantity } },
          data: { quantity: { decrement: item.quantity } },
        })

        if (variantUpdate.count === 0) {
          throw new Error(`${product.name} (${variant.label}) just sold out.`)
        }

        // Keep the product's aggregate stock in step with its variants.
        await tx.product.update({
          where: { id: product.id },
          data: { quantity: { decrement: item.quantity } },
        })
      } else {
        const updateResult = await tx.product.updateMany({
          where: { id: item.id, quantity: { gte: item.quantity } },
          data: { quantity: { decrement: item.quantity } },
        })

        if (updateResult.count === 0) {
          throw new Error(`${product.name || 'This item'} just sold out.`)
        }
      }
    }

    return tx.order.create({
      data: {
        stripeSessionId: checkoutSessionId,
        total: chargedTotal,
        status: 'new',
        ...orderDetails,
        items: {
          create: resolvedItems.map(({ item, product, variant }) => ({
            productId: product.id,
            variantId: variant ? variant.id : null,
            variantLabel: variant ? variant.label : null,
            name: variant ? `${product.name} (${variant.label})` : product.name,
            price: Number(variant ? variant.price : product.price),
            quantity: Number(item.quantity),
            imageUrl: product.imageUrl || null,
            category: product.category || null,
          })),
        },
      },
      include: {
        items: true,
      },
    })
  })
}

async function fulfillCheckoutSession(checkoutSessionId, fallbackItems = []) {
  if (!checkoutSessionId) {
    throw new Error('Checkout session ID is required.')
  }

  const existingOrder = await prisma.order.findUnique({
    where: { stripeSessionId: checkoutSessionId },
    include: { items: true },
  })

  if (existingOrder) {
    return { order: existingOrder, created: false }
  }

  const checkoutSession = await stripe.checkout.sessions.retrieve(checkoutSessionId)

  if (!checkoutSession || checkoutSession.payment_status !== 'paid') {
    throw new Error('Checkout session has not been paid yet.')
  }

  const metadataItems = parseCartReference(checkoutSession.metadata?.cart_reference || '')
  const sourceItems = metadataItems.length > 0 ? metadataItems : fallbackItems

  if (!sourceItems.length) {
    throw new Error('No purchased items were found for this checkout session.')
  }

  const normalizedItems = sourceItems.map((item) => ({
    id: Number(item.id),
    variantId: item.variantId ? Number(item.variantId) : null,
    quantity: Number(item.quantity),
  }))

  const order = await createOrderRecord({
    normalizedItems,
    chargedTotal: Number((checkoutSession.amount_total || 0) / 100),
    checkoutSessionId,
    orderDetails: getOrderDetailsFromSession(checkoutSession),
  })

  await Promise.allSettled([
    sendCustomerOrderEmail(order),
    sendInternalOrderNotification(order),
  ])

  return { order, created: true }
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true)
      }

      return callback(new Error('Origin not allowed by CORS'))
    },
    credentials: true,
  })
)

app.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripeWebhookSecret) {
    return res.status(503).send('Stripe webhook secret is not configured.')
  }

  const signature = req.headers['stripe-signature']

  if (!signature) {
    return res.status(400).send('Missing Stripe signature.')
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, stripeWebhookSecret)
  } catch (error) {
    console.error('Stripe webhook signature error:', error.message)
    return res.status(400).send(`Webhook Error: ${error.message}`)
  }

  try {
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      await fulfillCheckoutSession(event.data.object.id)
    }
  } catch (error) {
    console.error('Stripe webhook processing error:', error)
    return res.status(500).send('Webhook handling failed.')
  }

  return res.json({ received: true })
})

app.use(express.json())

app.get('/', (req, res) => {
  res.send('SUNBOUND BOHEME API running')
})

app.get('/auth/status', (req, res) => {
  res.json({
    authenticated: getAuthStatus(req),
    configured: isAdminConfigured(),
  })
})

app.get('/store-settings', async (req, res) => {
  try {
    const settings = await getStoreSettings()
    res.json(settings)
  } catch (error) {
    console.error('Store settings fetch error:', error)
    res.status(500).json({ error: 'Failed to load store settings.' })
  }
})

app.post('/auth/login', (req, res) => {
  const { password } = req.body
  const storedHash = process.env.ADMIN_PASSWORD_HASH || ''

  if (!isAdminConfigured()) {
    return res.status(503).json({
      error: 'Admin auth is not configured yet. Add your password hash to the server .env file.',
    })
  }

  if (!verifyPassword(password, storedHash)) {
    return res.status(401).json({ error: 'Incorrect password.' })
  }

  const sessionToken = createAdminSession()
  setSessionCookie(res, sessionToken)

  return res.json({ success: true })
})

app.post('/auth/logout', (req, res) => {
  const sessionToken = getSessionToken(req)
  clearAdminSession(sessionToken)
  clearSessionCookie(res)

  res.json({ success: true })
})

app.put('/store-settings', requireAdmin, async (req, res) => {
  try {
    const settings = await prisma.storeSettings.upsert({
      where: { id: 1 },
      update: {
        standardShippingRate: Number(req.body.standardShippingRate),
        heavyShippingRate: Number(req.body.heavyShippingRate),
        priorityShippingSurcharge: Number(req.body.priorityShippingSurcharge),
      },
      create: {
        id: 1,
        standardShippingRate: Number(req.body.standardShippingRate),
        heavyShippingRate: Number(req.body.heavyShippingRate),
        priorityShippingSurcharge: Number(req.body.priorityShippingSurcharge),
      },
    })

    res.json(settings)
  } catch (error) {
    console.error('Store settings update error:', error)
    res.status(500).json({ error: 'Failed to update store settings.' })
  }
})

app.use('/products', productRoutes)

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { cartItems } = req.body

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' })
    }
    const requestedItems = cartItems.map((item) => ({
      id: Number(item.id),
      variantId: item.variantId ? Number(item.variantId) : null,
      quantity: Number(item.quantity),
    }))
    const productIds = requestedItems.map((item) => item.id)
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      include: { variants: true },
    })
    const productMap = new Map(products.map((product) => [product.id, product]))
    const settings = await getStoreSettings()

    // Resolve the priced unit for a cart line: a specific variant when the
    // product has sizes, otherwise the product itself.
    function resolvePricedUnit(item) {
      const product = productMap.get(item.id)
      if (!product) {
        return { error: 'One of the products no longer exists.', status: 404 }
      }

      if (item.quantity <= 0) {
        return { error: 'Invalid cart quantity.', status: 400 }
      }

      if (item.variantId) {
        const variant = (product.variants || []).find((v) => v.id === item.variantId)
        if (!variant) {
          return { error: `A size for ${product.name} is no longer available.`, status: 404 }
        }
        if (variant.quantity < item.quantity) {
          return {
            error: `${product.name} (${variant.label}) only has ${variant.quantity} left in stock.`,
            status: 409,
          }
        }
        return {
          product,
          name: `${product.name} — ${variant.label}`,
          unitPrice: Number(variant.price),
        }
      }

      if ((product.variants || []).length > 0) {
        return { error: `Please choose a size for ${product.name}.`, status: 400 }
      }

      if (product.quantity < item.quantity) {
        return {
          error: `${product.name} only has ${product.quantity} left in stock.`,
          status: 409,
        }
      }

      return { product, name: product.name, unitPrice: Number(product.price) }
    }

    const resolvedUnits = []
    for (const item of requestedItems) {
      const resolved = resolvePricedUnit(item)
      if (resolved.error) {
        return res.status(resolved.status).json({ error: resolved.error })
      }
      resolvedUnits.push({ item, ...resolved })
    }

    const standardShippingCents = getStandardShippingCents(
      requestedItems,
      productMap,
      settings
    )

    const lineItems = resolvedUnits.map(({ item, product, name, unitPrice }) => ({
      quantity: item.quantity,
      price_data: {
        currency: 'usd',
        product_data: {
          name,
          images: product.imageUrl ? [product.imageUrl] : [],
          description: product.description || '',
          metadata: {
            productId: String(product.id),
            variantId: item.variantId ? String(item.variantId) : '',
          },
        },
        unit_amount: Math.round(unitPrice * 100),
        tax_behavior: 'exclusive',
      },
    }))

    const session = await stripe.checkout.sessions.create({
      billing_address_collection: 'auto',
      mode: 'payment',
      line_items: lineItems,
      shipping_address_collection: {
        allowed_countries: SHIPPING_COUNTRIES,
      },
      shipping_options: buildShippingOptions(standardShippingCents, settings),
      metadata: {
        cart_reference: serializeCartReference(requestedItems),
      },
      success_url: `${process.env.CLIENT_URL}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/checkout-cancel`,
    })

    res.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    res.status(500).json({ error: error.message || 'Failed to create checkout session.' })
  }
})

app.post('/orders', async (req, res) => {
  try {
    const { cartItems, total, checkoutSessionId } = req.body

    if ((!cartItems || cartItems.length === 0) && !checkoutSessionId) {
      return res.status(400).json({ error: 'No cart items provided.' })
    }

    const fallbackItems = (cartItems || []).map((item) => ({
      id: Number(item.id),
      variantId: item.variantId ? Number(item.variantId) : null,
      quantity: Number(item.quantity),
    }))
    let order

    if (checkoutSessionId) {
      const result = await fulfillCheckoutSession(checkoutSessionId, fallbackItems)
      return res.status(result.created ? 201 : 200).json(result.order)
    }

    const normalizedItems = fallbackItems
    const chargedTotal = Number(total)
    const orderDetails = {
      customerName: null,
      customerEmail: null,
      shippingLine1: null,
      shippingLine2: null,
      shippingCity: null,
      shippingState: null,
      shippingPostalCode: null,
      shippingCountry: null,
    }

    order = await createOrderRecord({
      normalizedItems,
      chargedTotal,
      checkoutSessionId: null,
      orderDetails,
    })

    await Promise.allSettled([
      sendCustomerOrderEmail(order),
      sendInternalOrderNotification(order),
    ])

    res.status(201).json(order)
  } catch (error) {
    console.error('Order save error:', error)
    res.status(500).json({ error: error.message || 'Failed to save order.' })
  }
})

app.get('/orders', requireAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    res.json(orders)
  } catch (error) {
    console.error('Order fetch error:', error)
    res.status(500).json({ error: 'Failed to load orders.' })
  }
})

app.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    res.json(buildDashboardMetrics(orders))
  } catch (error) {
    console.error('Dashboard metrics error:', error)
    res.status(500).json({ error: 'Failed to load dashboard metrics.' })
  }
})

app.put('/orders/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { status, trackingNumber, adminNotes } = req.body
    const allowedStatuses = new Set(['new', 'fulfilled', 'shipped'])

    if (!allowedStatuses.has(status)) {
      return res.status(400).json({ error: 'Invalid order status.' })
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found.' })
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: buildOrderAdminUpdateData(existingOrder, {
        status,
        trackingNumber,
        adminNotes,
      }),
      include: { items: true },
    })

    res.json(updatedOrder)
  } catch (error) {
    console.error('Order status update error:', error)
    res.status(500).json({ error: 'Failed to update order status.' })
  }
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
