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
      quantity: Number(item.quantity),
    }))
    const productIds = requestedItems.map((item) => item.id)
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    })
    const productMap = new Map(products.map((product) => [product.id, product]))
    const settings = await getStoreSettings()

    for (const item of requestedItems) {
      const product = productMap.get(item.id)

      if (!product) {
        return res.status(404).json({ error: 'One of the products no longer exists.' })
      }

      if (item.quantity <= 0) {
        return res.status(400).json({ error: 'Invalid cart quantity.' })
      }

      if (product.quantity < item.quantity) {
        return res.status(409).json({
          error: `${product.name} only has ${product.quantity} left in stock.`,
        })
      }
    }

    const standardShippingCents = getStandardShippingCents(
      requestedItems,
      productMap,
      settings
    )

    const lineItems = requestedItems.map((item) => {
      const product = productMap.get(item.id)

      return {
        quantity: item.quantity,
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            images: product.imageUrl ? [product.imageUrl] : [],
            description: product.description || '',
          },
          unit_amount: Math.round(Number(product.price) * 100),
          tax_behavior: 'exclusive',
        },
      }
    })

    const session = await stripe.checkout.sessions.create({
      billing_address_collection: 'auto',
      mode: 'payment',
      line_items: lineItems,
      shipping_address_collection: {
        allowed_countries: SHIPPING_COUNTRIES,
      },
      shipping_options: buildShippingOptions(standardShippingCents, settings),
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

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: 'No cart items provided.' })
    }

    if (checkoutSessionId) {
      const existingOrder = await prisma.order.findUnique({
        where: { stripeSessionId: checkoutSessionId },
        include: { items: true },
      })

      if (existingOrder) {
        return res.status(200).json(existingOrder)
      }
    }

    const normalizedItems = cartItems.map((item) => ({
      id: Number(item.id),
      quantity: Number(item.quantity),
    }))
    let chargedTotal = Number(total)
    let orderDetails = {
      customerName: null,
      customerEmail: null,
      shippingLine1: null,
      shippingLine2: null,
      shippingCity: null,
      shippingState: null,
      shippingPostalCode: null,
      shippingCountry: null,
    }

    if (checkoutSessionId) {
      const checkoutSession = await stripe.checkout.sessions.retrieve(checkoutSessionId)

      if (!checkoutSession || checkoutSession.payment_status !== 'paid') {
        return res.status(400).json({ error: 'Checkout session has not been paid yet.' })
      }

      chargedTotal = Number((checkoutSession.amount_total || 0) / 100)
      orderDetails = getOrderDetailsFromSession(checkoutSession)
    }

    const order = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: {
          id: {
            in: normalizedItems.map((item) => item.id),
          },
        },
      })
      const productMap = new Map(products.map((product) => [product.id, product]))

      for (const item of normalizedItems) {
        const product = productMap.get(item.id)

        if (!product) {
          throw new Error('One of the purchased products no longer exists.')
        }

        if (item.quantity <= 0) {
          throw new Error('Invalid purchase quantity.')
        }

        if (product.quantity < item.quantity) {
          throw new Error(`${product.name} is no longer available in that quantity.`)
        }
      }

      for (const item of normalizedItems) {
        const updateResult = await tx.product.updateMany({
          where: {
            id: item.id,
            quantity: {
              gte: item.quantity,
            },
          },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        })

        if (updateResult.count === 0) {
          const product = productMap.get(item.id)
          throw new Error(`${product?.name || 'This item'} just sold out.`)
        }
      }

      return tx.order.create({
        data: {
          stripeSessionId: checkoutSessionId || null,
          total: chargedTotal,
          status: 'new',
          ...orderDetails,
          items: {
            create: normalizedItems.map((item) => {
              const product = productMap.get(item.id)

              return {
                productId: product.id,
                name: product.name,
                price: Number(product.price),
                quantity: Number(item.quantity),
                imageUrl: product.imageUrl || null,
                category: product.category || null,
              }
            }),
          },
        },
        include: {
          items: true,
        },
      })
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
