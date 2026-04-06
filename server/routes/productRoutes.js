import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()

const prisma = new PrismaClient({
  __internal: {
    configOverride: (config) => ({
      ...config,
      datasource: {
        url: "file:./prisma/dev.db",
      },
    }),
  },
})

router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    })
    res.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)

    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({ error: 'Failed to fetch product' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, price, description, imageUrl, category, quantity } = req.body

    const newProduct = await prisma.product.create({
      data: {
        name,
        price: Number(price),
        description,
        imageUrl,
        category,
        quantity: Number(quantity),
      },
    })

    res.status(201).json(newProduct)
  } catch (error) {
    console.error('Error creating product:', error)
    res.status(500).json({ error: 'Failed to create product' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { name, price, description, imageUrl, category, quantity } = req.body

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
        price: Number(price),
        description,
        imageUrl,
        category,
        quantity: Number(quantity),
      },
    })

    res.json(updatedProduct)
  } catch (error) {
    console.error('Error updating product:', error)
    res.status(500).json({ error: 'Failed to update product' })
  }
})

router.delete('/:id', async (req, res) => {
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