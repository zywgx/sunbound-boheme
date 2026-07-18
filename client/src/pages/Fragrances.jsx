import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/useCart'
import { FRAGRANCE_FALLBACK_IMAGE, getProductPath, isFragranceProduct } from '../utils/productDisplay'
import { buildApiUrl } from '../lib/api'

const API_URL = buildApiUrl('/products')

// "The shelf" — browse the collection by when you'd actually reach for it.
const shelfCategories = [
  { title: 'Daily driver', blurb: 'Safe, versatile, compliment-getters you can wear on repeat.' },
  { title: 'Date night', blurb: 'The ones with a little more projection for when it counts.' },
  { title: 'Summer scents', blurb: 'Light, fresh, and built to last through the heat.' },
  { title: 'Winter scents', blurb: 'Warm, cozy, and made to last through the cold.' },
  { title: 'Value / dupes', blurb: "What's worth it — and what smells close for less." },
]

function fromPrice(product) {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return Math.min(...product.variants.map((variant) => Number(variant.price)))
  }
  return Number(product.price)
}

function SmellsLikeEmHeader({ cartCount }) {
  return (
    <header className="sle-header">
      <div className="sle-container sle-nav-wrapper">
        <Link to="/fragrances" className="sle-brand">
          Smells Like Em
        </Link>
        <nav className="sle-nav">
          <a href="#shelf">Categories</a>
          <a href="#reviews">Reviews</a>
          <a href="#about">About</a>
          <Link to="/" className="sle-home-link">Sunbound Boheme ↗</Link>
          <Link to="/fragrances/cart" className="sle-cart-link">
            Cart{cartCount > 0 ? ` (${cartCount})` : ''}
          </Link>
        </nav>
      </div>
    </header>
  )
}

function Fragrances() {
  const { cartCount } = useCart()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeOccasion, setActiveOccasion] = useState(null)

  function chooseOccasion(occasion) {
    setActiveOccasion((current) => (current === occasion ? null : occasion))
    const reviews = document.getElementById('reviews')
    if (reviews) {
      reviews.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const shownProducts = activeOccasion
    ? products.filter((product) => product.occasion === activeOccasion)
    : products

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch(API_URL)
        const data = await res.json()
        setProducts(Array.isArray(data) ? data.filter(isFragranceProduct) : [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return (
    <div className="sle-theme">
      <SmellsLikeEmHeader cartCount={cartCount} />

      <section className="sle-hero">
        <div className="sle-container">
          <p className="sle-eyebrow">Fragrance reviews, no gatekeeping</p>
          <h1>Scents you'll actually wear, reviewed by someone like you.</h1>
          <p className="sle-hero-text">
            No niche-collector gatekeeping. Just honest takes on the fragrances people actually
            reach for — daily drivers, date-night picks, dupes, and the designer stuff worth the
            price tag. Every scent is sold as a decant, so you can try before you commit.
          </p>
          <div className="sle-hero-actions">
            <a href="#reviews" className="sle-btn">Read the latest review</a>
            <a href="#reviews" className="sle-btn sle-btn-outline">Browse all reviews</a>
          </div>
        </div>
      </section>

      <section className="sle-section" id="shelf">
        <div className="sle-container">
          <div className="sle-section-head">
            <h2>The shelf</h2>
            <span className="sle-muted">Browse by occasion</span>
          </div>
          <div className="sle-shelf-grid">
            {shelfCategories.map((category) => (
              <button
                key={category.title}
                type="button"
                className={`sle-shelf-card${
                  activeOccasion === category.title ? ' is-active' : ''
                }`}
                onClick={() => chooseOccasion(category.title)}
              >
                <span className="sle-shelf-tag">{category.title.split(' ')[0]}</span>
                <h3>{category.title}</h3>
                <p>{category.blurb}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="sle-section sle-section-alt" id="reviews">
        <div className="sle-container">
          <div className="sle-section-head">
            <h2>{activeOccasion ? activeOccasion : 'Latest reviews'}</h2>
            {activeOccasion ? (
              <button
                type="button"
                className="sle-filter-clear"
                onClick={() => setActiveOccasion(null)}
              >
                Show all scents
              </button>
            ) : (
              <span className="sle-muted">Honest written takes — new ones added regularly.</span>
            )}
          </div>

          {loading ? (
            <p className="sle-muted">Loading scents...</p>
          ) : shownProducts.length > 0 ? (
            <div className="sle-review-grid">
              {shownProducts.map((product) => (
                <Link
                  key={product.id}
                  to={getProductPath(product)}
                  className="sle-review-card"
                >
                  <div className="sle-review-image">
                    <img
                      src={product.imageUrl || FRAGRANCE_FALLBACK_IMAGE}
                      alt={product.name}
                      onError={(event) => {
                        event.currentTarget.onerror = null
                        event.currentTarget.src = FRAGRANCE_FALLBACK_IMAGE
                      }}
                    />
                  </div>
                  <div className="sle-review-body">
                    {product.brand && <span className="sle-review-brand">{product.brand}</span>}
                    <h3>{product.name}</h3>
                    <p className="sle-review-take">{product.description}</p>
                    <span className="sle-review-price">
                      Decants from ${fromPrice(product).toFixed(2)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : activeOccasion ? (
            <p className="sle-muted">
              No scents tagged “{activeOccasion}” yet.{' '}
              <button
                type="button"
                className="sle-filter-clear"
                onClick={() => setActiveOccasion(null)}
              >
                Show all scents
              </button>
            </p>
          ) : (
            <p className="sle-muted">First reviews dropping soon.</p>
          )}
        </div>
      </section>

      <section className="sle-honesty" id="about">
        <div className="sle-container sle-honesty-grid">
          <div>
            <h2>Nobody paid me to say this.</h2>
            <p>
              No brand deals, no affiliate pressure, no sugarcoating. I buy it, I wear it, I tell
              you what I think. Whether you're grabbing your first bottle or you've got a full
              collection — if you want a real take from someone with no agenda, this is the place.
            </p>
          </div>
          <div className="sle-honesty-card">
            <span className="sle-honesty-kicker">What you get</span>
            <h3>Wearability first</h3>
            <ul>
              <li>Clear verdicts you can skim fast</li>
              <li>Price context, not just hype</li>
              <li>Decants built for normal buyers, not collectors</li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="sle-footer">
        <div className="sle-container">
          <p>Smells Like Em — honest fragrance reviews & decants.</p>
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

export default Fragrances
