import express from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAdmin } from '../utils/adminAuth.js'

const router = express.Router()

const prisma = new PrismaClient()

function parseGalleryImages(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed)
        ? parsed.map((item) => String(item || '').trim()).filter(Boolean)
        : []
    } catch {
      return []
    }
  }

  return []
}

function serializeGalleryImages(value) {
  return JSON.stringify(parseGalleryImages(value))
}

function formatProduct(product) {
  return {
    ...product,
    galleryImages: parseGalleryImages(product.galleryImages),
    variants: Array.isArray(product.variants)
      ? [...product.variants]
          .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
          .map((variant) => ({
            id: variant.id,
            label: variant.label,
            price: Number(variant.price),
            quantity: Number(variant.quantity),
            sortOrder: variant.sortOrder,
          }))
      : [],
  }
}

// Normalize a variants payload from the admin form into clean rows.
// Returns [] when the product has no variants (a normal single-price item).
function normalizeVariants(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((variant, index) => ({
      label: String(variant?.label ?? '').trim(),
      price: Number(variant?.price),
      quantity: Number.parseInt(variant?.quantity, 10),
      sortOrder: Number.isInteger(variant?.sortOrder) ? variant.sortOrder : index,
    }))
    .filter(
      (variant) =>
        variant.label &&
        Number.isFinite(variant.price) &&
        variant.price >= 0 &&
        Number.isInteger(variant.quantity) &&
        variant.quantity >= 0
    )
}

// When a product has variants, its base price/quantity are derived from them
// (lowest price shown as "from", total stock as availability).
function deriveBaseFromVariants(variants, fallbackPrice, fallbackQuantity) {
  if (!variants.length) {
    return {
      price: Number(fallbackPrice) || 0,
      quantity: Number.parseInt(fallbackQuantity, 10) || 0,
    }
  }

  return {
    price: Math.min(...variants.map((variant) => variant.price)),
    quantity: variants.reduce((total, variant) => total + variant.quantity, 0),
  }
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function getUniqueSlug(baseValue, excludeId) {
  const baseSlug = slugify(baseValue) || `product-${Date.now()}`
  let candidate = baseSlug
  let suffix = 2

  while (true) {
    const existingProduct = await prisma.product.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    })

    if (!existingProduct) {
      return candidate
    }

    candidate = `${baseSlug}-${suffix}`
    suffix += 1
  }
}

router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { variants: true },
    })
    res.json(products.map(formatProduct))
  } catch (error) {
    console.error('Error fetching products:', error)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const rawId = req.params.id
    const numericId = Number(rawId)

    const product = Number.isNaN(numericId)
      ? await prisma.product.findUnique({
          where: { slug: rawId },
          include: { variants: true },
        })
      : await prisma.product.findUnique({
          where: { id: numericId },
          include: { variants: true },
        })

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.json(formatProduct(product))
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({ error: 'Failed to fetch product' })
  }
})

router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      imageUrl,
      galleryImages,
      category,
      size,
      quantity,
      slug,
      shippingProfile,
      shippingCustomAmount,
      brand,
      fragranceType,
      authenticityNote,
      variants,
    } = req.body
    const resolvedSlug = await getUniqueSlug(slug || name)
    const normalizedVariants = normalizeVariants(variants)
    const base = deriveBaseFromVariants(normalizedVariants, price, quantity)

    const newProduct = await prisma.product.create({
      data: {
        name,
        slug: resolvedSlug,
        price: base.price,
        description,
        imageUrl,
        galleryImages: serializeGalleryImages(galleryImages),
        category,
        size: size ? String(size).trim() : null,
        quantity: base.quantity,
        shippingProfile: shippingProfile || 'standard',
        shippingCustomAmount:
          shippingCustomAmount === '' ||
          shippingCustomAmount === null ||
          shippingCustomAmount === undefined
            ? null
            : Number(shippingCustomAmount),
        brand: brand ? String(brand).trim() : null,
        fragranceType: fragranceType ? String(fragranceType).trim() : null,
        authenticityNote: authenticityNote ? String(authenticityNote).trim() : null,
        variants: normalizedVariants.length
          ? { create: normalizedVariants }
          : undefined,
      },
      include: { variants: true },
    })

    res.status(201).json(formatProduct(newProduct))
  } catch (error) {
    console.error('Error creating product:', error)
    res.status(500).json({ error: 'Failed to create product' })
  }
})

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const {
      name,
      price,
      description,
      imageUrl,
      galleryImages,
      category,
      size,
      quantity,
      slug,
      shippingProfile,
      shippingCustomAmount,
      brand,
      fragranceType,
      authenticityNote,
      variants,
    } = req.body

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' })
    }

    const normalizedVariants = normalizeVariants(variants)
    const base = deriveBaseFromVariants(normalizedVariants, price, quantity)

    // Replace variants wholesale: clear the old rows, then recreate from the payload.
    const updatedProduct = await prisma.$transaction(async (tx) => {
      await tx.productVariant.deleteMany({ where: { productId: id } })

      return tx.product.update({
        where: { id },
        data: {
          name,
          slug: await getUniqueSlug(slug || name, id),
          price: base.price,
          description,
          imageUrl,
          galleryImages: serializeGalleryImages(galleryImages),
          category,
          size: size ? String(size).trim() : null,
          quantity: base.quantity,
          shippingProfile: shippingProfile || 'standard',
          shippingCustomAmount:
            shippingCustomAmount === '' ||
            shippingCustomAmount === null ||
            shippingCustomAmount === undefined
              ? null
              : Number(shippingCustomAmount),
          brand: brand ? String(brand).trim() : null,
          fragranceType: fragranceType ? String(fragranceType).trim() : null,
          authenticityNote: authenticityNote ? String(authenticityNote).trim() : null,
          variants: normalizedVariants.length
            ? { create: normalizedVariants }
            : undefined,
        },
        include: { variants: true },
      })
    })

    res.json(formatProduct(updatedProduct))
  } catch (error) {
    console.error('Error updating product:', error)
    res.status(500).json({ error: 'Failed to update product' })
  }
})

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id)

    await prisma.product.delete({
      where: { id },
    })

    res.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    res.status(500).json({ error: 'Failed to delete product' })
  }
})

export default router
