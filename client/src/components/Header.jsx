import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../context/useCart'
import { buildApiUrl } from '../lib/api'
import SunGraphic from './SunGraphic'

const AUTH_STATUS_URL = buildApiUrl('/auth/status')

function Header() {
  const { cartCount } = useCart()
  const location = useLocation()
  const [showAdmin, setShowAdmin] = useState(false)

  useEffect(() => {
    let active = true

    async function loadAuthStatus() {
      try {
        const response = await fetch(AUTH_STATUS_URL, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Unable to check admin status')
        }

        const data = await response.json()

        if (active) {
          setShowAdmin(Boolean(data.authenticated))
        }
      } catch {
        if (active) {
          setShowAdmin(false)
        }
      }
    }

    function handleAuthChange() {
      loadAuthStatus()
    }

    loadAuthStatus()
    window.addEventListener('admin-auth-changed', handleAuthChange)

    return () => {
      active = false
      window.removeEventListener('admin-auth-changed', handleAuthChange)
    }
  }, [location.pathname])

  return (
    <header className="site-header">
      <div className="container nav-wrapper">
        <Link to="/" className="brand">
          <SunGraphic className="brand-sun" variant="burst" />
          SUNBOUND BOHEME
        </Link>

        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/fragrances">Fragrances</Link>
          <Link to="/support">Support</Link>
          <Link to="/policies">Policies</Link>
          {showAdmin && <Link to="/admin">Admin</Link>}
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
