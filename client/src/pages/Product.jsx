import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { useCart } from '../context/useCart'
import { FALLBACK_PRODUCT_IMAGE, FRAGRANCE_FALLBACK_IMAGE } from '../utils/productDisplay'
import SmellsLikeEmLayout from '../components/SmellsLikeEmLayout'
import { buildApiUrl } from '../lib/api'

function Product({ smellsLikeEm = false }) {
  const { id } = useParams()
  const { addToCart } = useCart()
  const backTo = smellsLikeEm ? '/fragrances' : '/shop'
  const backLabel = smellsLikeEm ? '<- Back to Smells Like Em' : '<- Back to Shop'
  const wrap = (content) =>
    smellsLikeEm ? <SmellsLikeEmLayout>{content}</SmellsLikeEmLayout> : content
  const fallbackImg = smellsLikeEm ? FRAGRANCE_FALLBACK_IMAGE : FALLBACK_PRODUCT_IMAGE

  const [product, setProduct] = useState(null)
  const [selectedImage, setSelectedImage] = useState('')
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true)
        setError('')
        const response = await axios.get(buildApiUrl(`/products/${id}`))
        setProduct(response.data)
        setSelectedImage(response.data.imageUrl || fallbackImg)
      } catch (err) {
        console.error('Failed to fetch product:', err)
        setError('Product not found.')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  // Default to the first in-stock size once a product with variants loads.
  useEffect(() => {
    const variants = product?.variants
    if (Array.isArray(variants) && variants.length > 0) {
      setSelectedVariant(variants.find((variant) => variant.quantity > 0) || variants[0])
    } else {
      setSelectedVariant(null)
    }
  }, [product])

  if (loading) {
    return wrap(
      <section className="section">
        <div className="container">
          <h1>Loading product...</h1>
        </div>
      </section>
    )
  }

  if (error || !product) {
    return wrap(
      <section className="section">
        <div className="container">
          <h1>Product not found</h1>
          <Link to={backTo} className="btn">
            {smellsLikeEm ? 'Back to Smells Like Em' : 'Back to Shop'}
          </Link>
        </div>
      </section>
    )
  }

  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0
  const activePrice = hasVariants
    ? Number(selectedVariant?.price ?? product.price)
    : Number(product.price)
  const activeStock = hasVariants
    ? Number(selectedVariant?.quantity ?? 0)
    : Number(product.quantity)
  const isOutOfStock = activeStock <= 0
  const galleryImages = [
    product.imageUrl,
    ...(Array.isArray(product.galleryImages) ? product.galleryImages : []),
  ].filter((imageUrl, index, images) => imageUrl && images.indexOf(imageUrl) === index)
  const activeImage = selectedImage || product.imageUrl || fallbackImg
  const fragranceNotes = product.fragranceNotes || null

  return wrap(
    <section className="section">
      <div className="container product-page">
        <div className="product-image-wrapper">
          <img
            src={activeImage}
            alt={product.name}
            className="product-detail-image"
            onError={(event) => {
              event.currentTarget.onerror = null
              event.currentTarget.src = fallbackImg
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
                      event.currentTarget.src = fallbackImg
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-detail-content">
          <p className="product-category">{product.category}</p>
          {product.brand && <p className="product-brand">{product.brand}</p>}
          {product.size && <p className="product-size product-size-detail">Size {product.size}</p>}

          <h1 className="product-title">{product.name}</h1>

          <p className="product-price large">
            ${activePrice.toFixed(2)}
            {hasVariants && selectedVariant && (
              <span className="product-price-unit"> / {selectedVariant.label}</span>
            )}
          </p>

          {hasVariants && (
            <div className="product-variant-picker">
              <span className="product-variant-label">Choose a size</span>
              <div className="product-variant-options">
                {product.variants.map((variant) => {
                  const soldOut = variant.quantity <= 0
                  const isActive = selectedVariant?.id === variant.id
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      className={`variant-option${isActive ? ' is-active' : ''}${
                        soldOut ? ' is-sold-out' : ''
                      }`}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={soldOut}
                    >
                      <span className="variant-option-label">{variant.label}</span>
                      <span className="variant-option-price">
                        ${Number(variant.price).toFixed(2)}
                      </span>
                      {soldOut && <span className="variant-option-note">Sold out</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="product-review-panel">
            <span>Em's review</span>
            <p>{product.description}</p>
          </div>

          {smellsLikeEm && fragranceNotes && (
            <div className="fragrance-notes-panel">
              <span className="fragrance-notes-kicker">Fragrance notes</span>
              <div className="fragrance-notes-grid">
                {[
                  ['Top', fragranceNotes.top],
                  ['Heart', fragranceNotes.heart],
                  ['Base', fragranceNotes.base],
                ].map(([label, notes]) => (
                  Array.isArray(notes) && notes.length > 0 ? (
                    <div className="fragrance-note-column" key={label}>
                      <strong>{label}</strong>
                      <p>{notes.join(', ')}</p>
                    </div>
                  ) : null
                ))}
              </div>
              {fragranceNotes.sourceType && (
                <p className="fragrance-notes-source">Notes source: {fragranceNotes.sourceType}</p>
              )}
            </div>
          )}

          {product.authenticityNote && (
            <p className="product-authenticity">{product.authenticityNote}</p>
          )}
          {smellsLikeEm ? (
            <>
              <button className="btn product-btn" type="button" disabled>
                Fragrance Testing Paused
              </button>
              <p className="product-pause-note">
                Fragrance decants are browse-only while final testing is underway.
              </p>
            </>
          ) : (
            <button
              className="btn product-btn"
              onClick={() => addToCart(product, hasVariants ? selectedVariant : null)}
              disabled={isOutOfStock || (hasVariants && !selectedVariant)}
            >
              {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
            </button>
          )}

          <div className="product-info-box">
            {product.brand && <p><strong>House:</strong> {product.brand}</p>}
            {product.fragranceType && <p><strong>Type:</strong> {product.fragranceType}</p>}
            {hasVariants ? (
              selectedVariant && <p><strong>Size:</strong> {selectedVariant.label}</p>
            ) : (
              <p><strong>Size:</strong> {product.size || 'Not listed'}</p>
            )}
            <p><strong>Shipping:</strong> Calculated at checkout</p>
            <p><strong>Returns:</strong> Case-by-case review</p>
            <p><strong>Available:</strong> {activeStock}</p>
          </div>

          <Link to={backTo} className="back-link">
            {backLabel}
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Product
