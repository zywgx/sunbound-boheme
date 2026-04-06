import { Link } from 'react-router-dom'
import { useCart } from '../context/useCart'

function Header() {
  const { cartCount } = useCart()

  return (
    <header className="site-header">
      <div className="container nav-wrapper">
        <Link to="/" className="brand">
          SUNBOUND BOHEME
        </Link>

        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/support">Support</Link>
          <Link to="/policies">Policies</Link>
          <Link to="/admin">Admin</Link>
          <Link to="/cart" className="cart-link">
            Cart
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default Header