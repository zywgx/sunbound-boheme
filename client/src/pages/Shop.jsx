import { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard'
import SunGraphic from '../components/SunGraphic'
import { buildApiUrl } from '../lib/api'

const API_URL = buildApiUrl('/products')

function Shop() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [size, setSize] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch(API_URL)
        const data = await res.json()
        setProducts(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase())

    const matchesCategory =
      category === 'All' || product.category === category

    const matchesSize = size === 'All' || product.size === size

    return matchesSearch && matchesCategory && matchesSize
  })

  const categories = ['All', ...new Set(products.map((product) => product.category).filter(Boolean))]
  const sizes = ['All', ...new Set(products.map((product) => product.size).filter(Boolean))]

  return (
    <section className="section">
      <div className="container">
        <div className="section-heading">
          <div>
            <SunGraphic className="page-sun" />
            <p className="section-label">Collection</p>
            <h1>Shop</h1>
            <p className="section-subtext">
              Explore the current SUNBOUND BOHEME edit of vintage-inspired, one-of-a-kind finds.
            </p>
          </div>
          {!loading && (
            <p className="shop-results-note">
              {filteredProducts.length} piece{filteredProducts.length === 1 ? '' : 's'} showing
            </p>
          )}
        </div>

        <input
          type="text"
          placeholder="Search items..."
          className="search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="filter-row">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-btn ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="shop-filter-toolbar">
          <label className="shop-filter-select">
            <span>Filter by size</span>
            <select value={size} onChange={(e) => setSize(e.target.value)}>
              {sizes.map((sizeOption) => (
                <option key={sizeOption} value={sizeOption}>
                  {sizeOption}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <p>Loading products...</p>
        ) : (
          filteredProducts.length > 0 ? (
            <div className="shop-grid">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} compact />
              ))}
            </div>
          ) : (
              <div className="shop-empty-state">
                <h2>No pieces match that search right now.</h2>
                <p>Try another keyword or clear the category filter to browse the full edit.</p>
              </div>
            )
        )}
      </div>
    </section>
  )
}

export default Shop
