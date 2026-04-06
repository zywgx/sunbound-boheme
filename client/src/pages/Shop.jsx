import { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard'

const API_URL = 'http://localhost:5000/products'

function Shop() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)

  const categories = ['All', 'Women', 'Accessories', 'Outerwear', 'Shoes']

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

    return matchesSearch && matchesCategory
  })

  return (
    <section className="section">
      <div className="container">
        <h1>Shop</h1>
        <p className="section-subtext">
          Explore the SUNBOUND BOHEME collection.
        </p>

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

        {loading ? (
          <p>Loading products...</p>
        ) : (
          <div className="shop-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} compact />
              ))
            ) : (
              <p className="no-results">No items found.</p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default Shop