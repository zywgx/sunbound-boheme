import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:5000/products'

const emptyForm = {
  name: '',
  price: '',
  description: '',
  imageUrl: '',
  category: '',
  quantity: '',
}

function Admin() {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function fetchProducts() {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(API_URL)

      if (!res.ok) {
        throw new Error('Failed to load products')
      }

      const data = await res.json()
      setProducts(data)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function handleEdit(product) {
    setEditingId(product.id)
    setForm({
      name: product.name || '',
      price: product.price ?? '',
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      category: product.category || '',
      quantity: product.quantity ?? '',
    })
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (
      !form.name.trim() ||
      !form.price ||
      !form.description.trim() ||
      !form.imageUrl.trim() ||
      !form.category.trim() ||
      form.quantity === ''
    ) {
      setError('Please fill out all fields.')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
        category: form.category.trim(),
        quantity: Number(form.quantity),
      }

      const url = editingId ? `${API_URL}/${editingId}` : API_URL
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error(
          editingId ? 'Failed to update product' : 'Failed to add product'
        )
      }

      setForm(emptyForm)
      setEditingId(null)
      await fetchProducts()
    } catch (err) {
      setError(err.message || 'Could not save product')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm('Delete this product?')
    if (!confirmed) return

    try {
      setError('')

      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete product')
      }

      if (editingId === id) {
        handleCancelEdit()
      }

      await fetchProducts()
    } catch (err) {
      setError(err.message || 'Could not delete product')
    }
  }

  return (
    <section className="section">
      <div className="container">
        <div className="admin-header">
          <div>
            <h1>Admin</h1>
            <p className="section-subtext">
              Add and manage SUNBOUND BOHEME products.
            </p>
          </div>
        </div>

        {error && <p className="admin-error">{error}</p>}

        <div className="admin-layout">
          <div className="admin-card">
            <h2>{editingId ? 'Edit Product' : 'Add Product'}</h2>

            <form className="admin-form" onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Product name"
                value={form.name}
                onChange={handleChange}
              />

              <input
                type="number"
                name="price"
                placeholder="Price"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
              />

              <input
                type="text"
                name="category"
                placeholder="Category"
                value={form.category}
                onChange={handleChange}
              />

              <input
                type="number"
                name="quantity"
                placeholder="Quantity"
                min="0"
                value={form.quantity}
                onChange={handleChange}
              />

              <input
                type="text"
                name="imageUrl"
                placeholder="Image URL"
                value={form.imageUrl}
                onChange={handleChange}
              />

              <textarea
                name="description"
                placeholder="Description"
                rows="5"
                value={form.description}
                onChange={handleChange}
              />

              <button className="btn" type="submit" disabled={submitting}>
                {submitting
                  ? editingId
                    ? 'Updating...'
                    : 'Adding...'
                  : editingId
                  ? 'Update Product'
                  : 'Add Product'}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancelEdit}
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </div>

          <div className="admin-card">
            <h2>Current Products</h2>

            {loading ? (
              <p>Loading products...</p>
            ) : products.length === 0 ? (
              <p>No products found.</p>
            ) : (
              <div className="admin-product-list">
                {products.map((product) => (
                  <div key={product.id} className="admin-product-item">
                    <img
                      src={product.imageUrl || product.image}
                      alt={product.name}
                      className="admin-product-thumb"
                    />

                    <div className="admin-product-info">
                      <h3>{product.name}</h3>
                      <p>{product.category}</p>
                      <p>${Number(product.price).toFixed(2)}</p>
                      <p>Qty: {product.quantity}</p>
                    </div>

                    <div className="admin-product-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleEdit(product)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="btn"
                        onClick={() => handleDelete(product.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Admin