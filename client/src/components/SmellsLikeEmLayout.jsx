import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

// Shared chrome for the Smells Like Em fragrance brand. Wraps any page in the
// green + cream theme with its own header and footer.
//
// There is no cart link while fragrance checkout is paused: decants cannot be
// added to the cart yet, so the cart would only ever show Sunbound items.
function SmellsLikeEmLayout({ children }) {
  const { pathname, hash } = useLocation()

  // Start each fragrance page at the top unless a section link (#reviews etc.)
  // asked for a specific spot. Without this, opening a scent from far down the
  // list lands you halfway down the product page on phones.
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])

  return (
    <div className="sle-theme">
      <header className="sle-header">
        <div className="sle-container sle-nav-wrapper">
          <Link to="/fragrances" className="sle-brand">
            Smells Like Em
          </Link>
          <nav className="sle-nav" aria-label="Smells Like Em">
            <Link to="/fragrances#shelf">Categories</Link>
            <Link to="/fragrances#reviews">Reviews</Link>
            <Link to="/fragrances#about">About</Link>
            <Link to="/fragrances#contact">Inquiries</Link>
            <Link to="/" className="sle-home-link">Sunbound Boheme →</Link>
          </nav>
        </div>
      </header>

      {children}

      <footer className="sle-footer">
        <div className="sle-container">
          <p>Smells Like Em — honest fragrance reviews &amp; decants.</p>
          <p className="sle-muted">
            Part of the{' '}
            <Link to="/" className="sle-footer-link">Sunbound Boheme</Link>{' '}
            family. Scents sold as decants only.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default SmellsLikeEmLayout
