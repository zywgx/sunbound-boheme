import { Link } from 'react-router-dom'
import { useCart } from '../context/useCart'

// Shared chrome for the Smells Like Em fragrance brand. Wraps any page in the
// green + cream theme with its own header and footer.
function SmellsLikeEmLayout({ children }) {
  const { cartCount } = useCart()

  return (
    <div className="sle-theme">
      <header className="sle-header">
        <div className="sle-container sle-nav-wrapper">
          <Link to="/fragrances" className="sle-brand">
            Smells Like Em
          </Link>
          <nav className="sle-nav">
            <Link to="/fragrances#shelf">Categories</Link>
            <Link to="/fragrances#reviews">Reviews</Link>
            <Link to="/fragrances#about">About</Link>
            <Link to="/fragrances/cart" className="sle-cart-link">
              Cart{cartCount > 0 ? ` (${cartCount})` : ''}
            </Link>
          </nav>
        </div>
      </header>

      {children}

      <footer className="sle-footer">
        <div className="sle-container">
          <p>Smells Like Em — honest fragrance reviews &amp; decants.</p>
          <p className="sle-muted">Part of the Sunbound family. Scents sold as decants only.</p>
        </div>
      </footer>
    </div>
  )
}

export default SmellsLikeEmLayout
