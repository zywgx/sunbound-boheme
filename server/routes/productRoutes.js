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
        })
      : await prisma.product.findUnique({
          where: { id: numericId },
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
    } = req.body
    const resolvedSlug = await getUniqueSlug(slug || name)

    const newProduct = await prisma.product.create({
      data: {
        name,
        slug: resolvedSlug,
        price: Number(price),
        description,
        imageUrl,
        galleryImages: serializeGalleryImages(galleryImages),
        category,
        size: size ? String(size).trim() : null,
        quantity: Number(quantity),
        shippingProfile: shippingProfile || 'standard',
        shippingCustomAmount:
          shippingCustomAmount === '' ||
          shippingCustomAmount === null ||
          shippingCustomAmount === undefined
            ? null
            : Number(shippingCustomAmount),
      },
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
    } = req.body

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' })
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        slug: await getUniqueSlug(slug || name, id),
        price: Number(price),
        description,
        imageUrl,
        galleryImages: serializeGalleryImages(galleryImages),
        category,
        size: size ? String(size).trim() : null,
        quantity: Number(quantity),
        shippingProfile: shippingProfile || 'standard',
        shippingCustomAmount:
          shippingCustomAmount === '' ||
          shippingCustomAmount === null ||
          shippingCustomAmount === undefined
            ? null
            : Number(shippingCustomAmount),
      },
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
