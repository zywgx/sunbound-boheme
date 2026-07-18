import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import SunGraphic from '../components/SunGraphic'
import { isFragranceProduct } from '../utils/productDisplay'
import { buildApiUrl } from '../lib/api'

const API_URL = buildApiUrl('/products')

function Fragrances() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

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

  const filteredProducts = products.filter((product) => {
    const haystack = `${product.name} ${product.brand || ''}`.toLowerCase()
    return haystack.includes(search.toLowerCase())
  })

  return (
    <section className="section">
      <div className="container">
        <div className="section-heading">
          <div>
            <SunGraphic className="page-sun" />
            <p className="section-label">Scent</p>
            <h1>Fragrances</h1>
            <p className="section-subtext">
              Sun-warmed scents to match the wardrobe — offered as decants to sample and
              full bottles to keep. Choose your size on each fragrance.
            </p>
          </div>
          {!loading && (
            <p className="shop-results-note">
              {filteredProducts.length} scent{filteredProducts.length === 1 ? '' : 's'} showing
            </p>
          )}
        </div>

        <input
          type="text"
          placeholder="Search fragrances..."
          className="search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <p>Loading fragrances...</p>
        ) : filteredProducts.length > 0 ? (
          <div className="shop-grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>
        ) : (
          <div className="shop-empty-state">
            <h2>No fragrances just yet.</h2>
            <p>
              New scents are being decanted now. Check back soon, or{' '}
              <Link to="/shop">browse the full shop</Link>.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default Fragrances
