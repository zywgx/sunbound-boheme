import { Link } from 'react-router-dom'

function ProductCard({ product, compact = false }) {
  return (
    <Link
      to={`/product/${product.id}`}
      className={`product-card-link ${compact ? 'product-card-compact' : ''}`}
    >
      <div className={compact ? 'product-card-compact' : 'product-card'}>
        <img
          src={product.imageUrl || product.image}
          alt={product.name}
          className="product-image"
        />

        <div className="product-card-content">
          <h3>{product.name}</h3>
          <p className="product-category">{product.category}</p>
          <p className="product-price">${product.price}</p>
        </div>
      </div>
    </Link>
  )
}

export default ProductCard