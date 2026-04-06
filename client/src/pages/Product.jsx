import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { useCart } from '../context/useCart'

function Product() {
  const { id } = useParams()
  const { addToCart } = useCart()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true)
        setError('')
        const response = await axios.get(`http://localhost:5000/products/${id}`)
        setProduct(response.data)
      } catch (err) {
        console.error('Failed to fetch product:', err)
        setError('Product not found.')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  if (loading) {
    return (
      <section className="section">
        <div className="container">
          <h1>Loading product...</h1>
        </div>
      </section>
    )
  }

  if (error || !product) {
    return (
      <section className="section">
        <div className="container">
          <h1>Product not found</h1>
          <Link to="/shop" className="btn">
            Back to Shop
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <div className="container product-page">
        <div className="product-image-wrapper">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="product-detail-image"
          />
        </div>

        <div className="product-detail-content">
          <p className="product-category">{product.category}</p>

          <h1 className="product-title">{product.name}</h1>

          <p className="product-price large">${product.price}</p>

          <p className="product-description">{product.description}</p>

          <button
            className="btn product-btn"
            onClick={() => addToCart(product)}
          >
            Add to Cart
          </button>

          <div className="product-info-box">
            <p><strong>Shipping:</strong> Calculated at checkout</p>
            <p><strong>Returns:</strong> Case-by-case review</p>
            <p><strong>Available:</strong> {product.quantity}</p>
          </div>

          <Link to="/shop" className="back-link">
            ← Back to Shop
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Product