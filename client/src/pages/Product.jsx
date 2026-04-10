import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { useCart } from '../context/useCart'
import { FALLBACK_PRODUCT_IMAGE } from '../utils/productDisplay'
import { buildApiUrl } from '../lib/api'

function Product() {
  const { id } = useParams()
  const { addToCart } = useCart()

  const [product, setProduct] = useState(null)
  const [selectedImage, setSelectedImage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true)
        setError('')
        const response = await axios.get(buildApiUrl(`/products/${id}`))
        setProduct(response.data)
        setSelectedImage(response.data.imageUrl || FALLBACK_PRODUCT_IMAGE)
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

  const isOutOfStock = product.quantity <= 0
  const galleryImages = [
    product.imageUrl,
    ...(Array.isArray(product.galleryImages) ? product.galleryImages : []),
  ].filter((imageUrl, index, images) => imageUrl && images.indexOf(imageUrl) === index)
  const activeImage = selectedImage || product.imageUrl || FALLBACK_PRODUCT_IMAGE

  return (
    <section className="section">
      <div className="container product-page">
        <div className="product-image-wrapper">
          <img
            src={activeImage}
            alt={product.name}
            className="product-detail-image"
            onError={(event) => {
              event.currentTarget.onerror = null
              event.currentTarget.src = FALLBACK_PRODUCT_IMAGE
            }}
          />

          {galleryImages.length > 1 && (
            <div className="product-gallery-strip">
              {galleryImages.map((imageUrl, index) => (
                <button
                  key={`${imageUrl}-${index}`}
                  type="button"
                  className={`product-gallery-thumb${
                    activeImage === imageUrl ? ' is-active' : ''
                  }`}
                  onClick={() => setSelectedImage(imageUrl)}
                >
                  <img
                    src={imageUrl}
                    alt={`${product.name} view ${index + 1}`}
                    onError={(event) => {
                      event.currentTarget.onerror = null
                      event.currentTarget.src = FALLBACK_PRODUCT_IMAGE
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-detail-content">
          <p className="product-category">{product.category}</p>

          <h1 className="product-title">{product.name}</h1>

          <p className="product-price large">${Number(product.price).toFixed(2)}</p>

          <p className="product-description">{product.description}</p>

          <button
            className="btn product-btn"
            onClick={() => addToCart(product)}
            disabled={isOutOfStock}
          >
            {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
          </button>

          <div className="product-info-box">
            <p><strong>Shipping:</strong> Calculated at checkout</p>
            <p><strong>Returns:</strong> Case-by-case review</p>
            <p><strong>Available:</strong> {product.quantity}</p>
          </div>

          <Link to="/shop" className="back-link">
            {'<- Back to Shop'}
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Product
