import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import productRoutes from './routes/productRoutes.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('SUNBOUND BOHEME API running 🌞')
})

app.use('/products', productRoutes)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})