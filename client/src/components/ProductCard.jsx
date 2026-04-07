import { Link } from 'react-router-dom'
import { FALLBACK_PRODUCT_IMAGE, getProductPath } from '../utils/productDisplay'

function ProductCard({ product, compact = false }) {
  const isOutOfStock = Number(product.quantity) <= 0

  return (
    <Link
      to={getProductPath(product)}
      className={`product-card-link ${compact ? 'product-card-compact' : ''}`}
    >
      <div className={compact ? 'product-card-compact' : 'product-card'}>
        <img
          src={product.imageUrl || product.image}
          alt={product.name}
          className="product-image"
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src = FALLBACK_PRODUCT_IMAGE
          }}
        />

        <div className="product-card-content">
          <h3>{product.name}</h3>
          <p className="product-category">{product.category}</p>
          <p className="product-price">${product.price}</p>
          {isOutOfStock && <p className="product-stock-note">Sold Out</p>}
        </div>
      </div>
    </Link>
  )
}

export default ProductCard
