import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'

const API_URL = 'http://localhost:5000/products'

function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch(API_URL)
        const data = await res.json()

        // only show first 4 as featured
        setProducts(data.slice(0, 4))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return (
    <div>
      <section className="hero">
        <div className="container hero-content">
          <p className="eyebrow">Vintage • Boho • Traveler Soul</p>
          <h1>Curated pieces with warmth, story, and sun-soaked style.</h1>
          <p className="hero-text">
            SUNBOUND BOHEME brings together boho charm, earthy color, and timeless resale finds.
          </p>

          <div className="hero-actions">
            <Link to="/shop" className="btn">
              Shop Collection
            </Link>
          </div>
        </div>
      </section>

      <section className="section featured-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="section-label">Featured</p>
              <h2>Featured Products</h2>
              <p className="section-subtext">
                A few handpicked pieces to give you a feel for the collection.
              </p>
            </div>

            <Link to="/shop" className="btn btn-secondary">
              View All Products
            </Link>
          </div>

          {loading ? (
            <p>Loading products...</p>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section trust-section">
        <div className="container trust-grid">
          <div className="trust-item">
            <h3>Curated Pieces</h3>
            <p>Selected with a focus on style, warmth, and character.</p>
          </div>

          <div className="trust-item">
            <h3>Clear Condition Notes</h3>
            <p>We aim to present items honestly and thoughtfully.</p>
          </div>

          <div className="trust-item">
            <h3>Fair Support</h3>
            <p>Every issue is reviewed carefully and case by case.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home