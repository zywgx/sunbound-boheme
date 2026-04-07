import { useEffect, useState } from 'react'
import { buildApiUrl } from '../lib/api'

const API_URL = buildApiUrl('/products')
const ORDERS_URL = buildApiUrl('/orders')
const AUTH_URL = buildApiUrl('/auth')
const STORE_SETTINGS_URL = buildApiUrl('/store-settings')
const ORDER_STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'shipped', label: 'Shipped' },
]
const CATEGORY_OPTIONS = [
  'Tops',
  'Bottoms',
  'Dresses',
  'Outerwear',
  'Shoes',
  'Accessories',
  'Sets',
  'Vintage',
  'Home',
  'Custom',
]
const CLOUDINARY_CLOUD_NAME = 'dbil6mtce'
const CLOUDINARY_UPLOAD_PRESET = 'sunbound_products'
const DEFAULT_SHIPPING_SETTINGS = {
  standardShippingRate: 6.95,
  heavyShippingRate: 12.95,
  priorityShippingSurcharge: 6,
}

const emptyForm = {
  name: '',
  price: '',
  description: '',
  imageUrl: '',
  category: '',
  slug: '',
  quantity: '',
  shippingProfile: 'standard',
  shippingCustomAmount: '',
}

function Admin() {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [storeSettings, setStoreSettings] = useState(DEFAULT_SHIPPING_SETTINGS)
  const [settingsForm, setSettingsForm] = useState(DEFAULT_SHIPPING_SETTINGS)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [authChecked, setAuthChecked] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [authConfigured, setAuthConfigured] = useState(true)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [cloudinaryReady, setCloudinaryReady] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch(`${AUTH_URL}/status`, {
          credentials: 'include',
        })

        if (!res.ok) {
          throw new Error('Could not check admin session.')
        }

        const data = await res.json()
        setAuthenticated(data.authenticated)
        setAuthConfigured(data.configured)
      } catch (err) {
        setError(err.message || 'Could not check admin access.')
      } finally {
        setAuthChecked(true)
      }
    }

    checkAuth()
  }, [])

  useEffect(() => {
    if (!authenticated) {
      setLoading(false)
      setOrdersLoading(false)
      return
    }

    fetchDashboardData()
  }, [authenticated])

  useEffect(() => {
    if (!authenticated) {
      return
    }

    if (window.cloudinary) {
      setCloudinaryReady(true)
      return
    }

    const existingScript = document.querySelector(
      'script[data-cloudinary-upload-widget="true"]'
    )

    if (existingScript) {
      existingScript.addEventListener('load', () => setCloudinaryReady(true))
      return
    }

    const script = document.createElement('script')
    script.src = 'https://upload-widget.cloudinary.com/latest/global/all.js'
    script.async = true
    script.dataset.cloudinaryUploadWidget = 'true'
    script.onload = () => setCloudinaryReady(true)
    document.body.appendChild(script)
  }, [authenticated])

  async function fetchDashboardData() {
    await Promise.all([fetchProducts(), fetchOrders(), fetchStoreSettings()])
  }

  function getShippingPresets(settings = storeSettings) {
    return [
      {
        value: 'standard',
        label: `Standard ($${Number(settings.standardShippingRate).toFixed(2)})`,
      },
      {
        value: 'heavy',
        label: `Heavy / Oversized ($${Number(settings.heavyShippingRate).toFixed(2)})`,
      },
      {
        value: 'free',
        label: 'Free Shipping ($0.00)',
      },
    ]
  }

  function getCategoryOptions(currentCategory = form.category) {
    return currentCategory && !CATEGORY_OPTIONS.includes(currentCategory)
      ? [currentCategory, ...CATEGORY_OPTIONS]
      : CATEGORY_OPTIONS
  }

  async function fetchProducts() {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(API_URL, {
        credentials: 'include',
      })

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

  async function fetchOrders() {
    try {
      setOrdersLoading(true)
      const res = await fetch(ORDERS_URL, {
        credentials: 'include',
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      if (!res.ok) {
        throw new Error('Failed to load orders')
      }

      const data = await res.json()
      setOrders(data)
    } catch (err) {
      setError(err.message || 'Could not load orders')
    } finally {
      setOrdersLoading(false)
    }
  }

  async function handleSaveOrder(orderId, updates) {
    try {
      setError('')

      const res = await fetch(`${ORDERS_URL}/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      if (!res.ok) {
        throw new Error('Failed to update order status')
      }

      const updatedOrder = await res.json()
      setOrders((prev) =>
        prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
      )
    } catch (err) {
      setError(err.message || 'Could not update order status')
    }
  }

  async function fetchStoreSettings() {
    try {
      const res = await fetch(STORE_SETTINGS_URL, {
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('Failed to load shipping settings')
      }

      const data = await res.json()
      setStoreSettings(data)
      setSettingsForm({
        standardShippingRate: data.standardShippingRate,
        heavyShippingRate: data.heavyShippingRate,
        priorityShippingSurcharge: data.priorityShippingSurcharge,
      })
    } catch (err) {
      setError(err.message || 'Could not load shipping settings')
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function handleSettingsChange(e) {
    const { name, value } = e.target
    setSettingsForm((prev) => ({
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
      slug: product.slug || '',
      quantity: product.quantity ?? '',
      shippingProfile: product.shippingProfile || 'standard',
      shippingCustomAmount: product.shippingCustomAmount ?? '',
    })
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  async function handleLogin(e) {
    e.preventDefault()

    if (!password.trim()) {
      setError('Enter the shared admin password to continue.')
      return
    }

    try {
      setLoginLoading(true)
      setError('')

      const res = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Could not sign in.')
      }

      setPassword('')
      setAuthenticated(true)
      window.dispatchEvent(new Event('admin-auth-changed'))
    } catch (err) {
      setError(err.message || 'Could not sign in.')
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await fetch(`${AUTH_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      setAuthenticated(false)
      setEditingId(null)
      setForm(emptyForm)
      setProducts([])
      setOrders([])
      setError('')
      window.dispatchEvent(new Event('admin-auth-changed'))
    }
  }

  function handleUnauthorized() {
    setAuthenticated(false)
    setProducts([])
    setOrders([])
    setEditingId(null)
    setForm(emptyForm)
    setError('Your admin session expired. Please sign in again.')
  }

  function handleImageUpload() {
    if (!window.cloudinary) {
      setError('Image upload is still loading. Please try again in a moment.')
      return
    }

    setUploadingImage(true)
    setError('')

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        multiple: false,
        sources: ['local', 'camera'],
        folder: 'sunbound-boheme/products',
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
      },
      (widgetError, result) => {
        if (widgetError) {
          setUploadingImage(false)
          setError('Image upload failed. Please try again.')
          return
        }

        if (result.event === 'success') {
          setForm((prev) => ({
            ...prev,
            imageUrl: result.info.secure_url,
          }))
          setUploadingImage(false)
        }

        if (result.event === 'close') {
          setUploadingImage(false)
        }
      }
    )

    widget.open()
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
        slug: form.slug.trim(),
        quantity: Number(form.quantity),
        shippingProfile: form.shippingProfile,
        shippingCustomAmount:
          form.shippingCustomAmount === ''
            ? null
            : Number(form.shippingCustomAmount),
      }

      const url = editingId ? `${API_URL}/${editingId}` : API_URL
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      if (!res.ok) {
        throw new Error(
          editingId ? 'Failed to update product' : 'Failed to add product'
        )
      }

      setForm(emptyForm)
      setEditingId(null)
      await fetchDashboardData()
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
        credentials: 'include',
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

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

  async function handleSaveShippingSettings(e) {
    e.preventDefault()

    try {
      setSettingsSaving(true)
      setError('')

      const payload = {
        standardShippingRate: Number(settingsForm.standardShippingRate),
        heavyShippingRate: Number(settingsForm.heavyShippingRate),
        priorityShippingSurcharge: Number(settingsForm.priorityShippingSurcharge),
      }

      const res = await fetch(STORE_SETTINGS_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      if (!res.ok) {
        throw new Error('Failed to save shipping settings')
      }

      const data = await res.json()
      setStoreSettings(data)
      setSettingsForm({
        standardShippingRate: data.standardShippingRate,
        heavyShippingRate: data.heavyShippingRate,
        priorityShippingSurcharge: data.priorityShippingSurcharge,
      })
    } catch (err) {
      setError(err.message || 'Could not save shipping settings')
    } finally {
      setSettingsSaving(false)
    }
  }

  if (!authChecked) {
    return (
      <section className="section">
        <div className="container admin-login-shell">
          <div className="admin-login-card">
            <h1>Checking admin access...</h1>
          </div>
        </div>
      </section>
    )
  }

  if (!authenticated) {
    return (
      <section className="section">
        <div className="container admin-login-shell">
          <div className="admin-login-card">
            <p className="section-label">Private Admin</p>
            <h1>Sign in to manage products</h1>
            <p className="section-subtext">
              This area is for your family admin login. Once signed in, you can add products and
              upload images directly.
            </p>

            {!authConfigured && (
              <p className="admin-helper">
                Admin login is not configured yet. Add your generated password hash and session
                secret in the server `.env` file first.
              </p>
            )}

            {error && <p className="admin-error">{error}</p>}

            <form className="admin-login-form" onSubmit={handleLogin}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Shared admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!authConfigured || loginLoading}
              />

              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowPassword((current) => !current)}
                disabled={!authConfigured || loginLoading}
              >
                {showPassword ? 'Hide Password' : 'Show Password'}
              </button>

              <button
                className="btn"
                type="submit"
                disabled={!authConfigured || loginLoading}
              >
                {loginLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <div className="container">
        <div className="admin-header">
          <div>
            <p className="section-label">Private Admin</p>
            <h1>Manage products</h1>
            <p className="section-subtext">
              Add new products, upload images from your computer, and keep the shop updated without
              needing image URLs by hand.
            </p>
          </div>

          <button type="button" className="btn btn-outline" onClick={handleLogout}>
            Log Out
          </button>
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

              <label className="admin-field-group">
                <span>Category</span>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                >
                  <option value="">Select a category</option>
                  {getCategoryOptions().map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-field-group">
                <span>Product slug (optional)</span>
                <input
                  type="text"
                  name="slug"
                  placeholder="Leave blank to auto-generate"
                  value={form.slug}
                  onChange={handleChange}
                />
              </label>

              <input
                type="number"
                name="quantity"
                placeholder="Quantity"
                min="0"
                value={form.quantity}
                onChange={handleChange}
              />

              <label className="admin-field-group">
                <span>Shipping preset</span>
                <select
                  name="shippingProfile"
                  value={form.shippingProfile}
                  onChange={handleChange}
                >
                  {getShippingPresets().map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-field-group">
                <span>Custom shipping override (optional)</span>
                <input
                  type="number"
                  name="shippingCustomAmount"
                  placeholder="Leave blank to use preset"
                  min="0"
                  step="0.01"
                  value={form.shippingCustomAmount}
                  onChange={handleChange}
                />
              </label>

              <div className="admin-upload-group">
                <div className="admin-upload-row">
                  <input
                    type="text"
                    name="imageUrl"
                    placeholder="Image URL appears here after upload"
                    value={form.imageUrl}
                    onChange={handleChange}
                  />

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleImageUpload}
                    disabled={!cloudinaryReady || uploadingImage}
                  >
                    {uploadingImage
                      ? 'Uploading...'
                      : cloudinaryReady
                      ? 'Upload Image'
                      : 'Loading Upload Tool...'}
                  </button>
                </div>

                {form.imageUrl && (
                  <img
                    src={form.imageUrl}
                    alt="Selected product"
                    className="admin-upload-preview"
                  />
                )}
              </div>

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
                      {product.slug && <p>Slug: {product.slug}</p>}
                      <p>${Number(product.price).toFixed(2)}</p>
                      <p>Qty: {product.quantity}</p>
                      <p>
                        Shipping:{' '}
                        {product.shippingCustomAmount !== null &&
                        product.shippingCustomAmount !== undefined
                          ? `$${Number(product.shippingCustomAmount).toFixed(2)} custom`
                          : getShippingPresets().find(
                              (preset) => preset.value === product.shippingProfile
                            )?.label || `Standard ($${Number(storeSettings.standardShippingRate).toFixed(2)})`}
                      </p>
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

        <div className="admin-card admin-orders-card">
          <div className="admin-orders-header">
            <div>
              <p className="section-label">Shipping Settings</p>
              <h2>Preset rates</h2>
            </div>
          </div>

          <form className="admin-settings-form" onSubmit={handleSaveShippingSettings}>
            <label className="admin-field-group">
              <span>Standard shipping preset</span>
              <input
                type="number"
                min="0"
                step="0.01"
                name="standardShippingRate"
                value={settingsForm.standardShippingRate}
                onChange={handleSettingsChange}
              />
            </label>

            <label className="admin-field-group">
              <span>Heavy / oversized preset</span>
              <input
                type="number"
                min="0"
                step="0.01"
                name="heavyShippingRate"
                value={settingsForm.heavyShippingRate}
                onChange={handleSettingsChange}
              />
            </label>

            <label className="admin-field-group">
              <span>Priority shipping add-on</span>
              <input
                type="number"
                min="0"
                step="0.01"
                name="priorityShippingSurcharge"
                value={settingsForm.priorityShippingSurcharge}
                onChange={handleSettingsChange}
              />
            </label>

            <button className="btn" type="submit" disabled={settingsSaving}>
              {settingsSaving ? 'Saving Rates...' : 'Save Shipping Rates'}
            </button>
          </form>
        </div>

        <div className="admin-card admin-orders-card">
          <div className="admin-orders-header">
            <div>
              <p className="section-label">Orders</p>
              <h2>Recent purchases</h2>
            </div>

            <button
              type="button"
              className="btn btn-outline"
              onClick={fetchOrders}
              disabled={ordersLoading}
            >
              {ordersLoading ? 'Refreshing...' : 'Refresh Orders'}
            </button>
          </div>

          {ordersLoading ? (
            <p>Loading orders...</p>
          ) : orders.length === 0 ? (
            <p>No orders yet.</p>
          ) : (
            <div className="admin-order-list">
              {orders.map((order) => (
                <article key={order.id} className="admin-order-item">
                  <div className="admin-order-summary">
                    <div>
                      <h3>Order #{order.id}</h3>
                      <p>{new Date(order.createdAt).toLocaleString()}</p>
                      <p className="admin-order-status">
                        Status:{' '}
                        {ORDER_STATUS_OPTIONS.find((option) => option.value === order.status)?.label ||
                          order.status ||
                          'new'}
                      </p>
                    </div>

                    <strong>${Number(order.total).toFixed(2)}</strong>
                  </div>

                  <div className="admin-order-meta">
                    <form
                      className="admin-order-form"
                      onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        handleSaveOrder(order.id, {
                          status: formData.get('status'),
                          trackingNumber: formData.get('trackingNumber'),
                          adminNotes: formData.get('adminNotes'),
                        })
                      }}
                    >
                      <label className="admin-field-group">
                        <span>Order status</span>
                        <select name="status" defaultValue={order.status || 'new'}>
                          {ORDER_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="admin-field-group">
                        <span>Tracking number</span>
                        <input
                          type="text"
                          name="trackingNumber"
                          placeholder="Add tracking once shipped"
                          defaultValue={order.trackingNumber || ''}
                        />
                      </label>

                      <label className="admin-field-group admin-order-notes">
                        <span>Admin notes</span>
                        <textarea
                          name="adminNotes"
                          rows="3"
                          placeholder="Packing notes, customer follow-up, etc."
                          defaultValue={order.adminNotes || ''}
                        />
                      </label>

                      <button type="submit" className="btn btn-secondary">
                        Save Order Update
                      </button>
                    </form>

                    <div className="admin-order-details">
                      <p>
                        <strong>Customer:</strong> {order.customerName || 'Not captured'}
                      </p>
                      <p>
                        <strong>Email:</strong> {order.customerEmail || 'Not captured'}
                      </p>
                      {order.fulfilledAt && (
                        <p>
                          <strong>Fulfilled:</strong>{' '}
                          {new Date(order.fulfilledAt).toLocaleString()}
                        </p>
                      )}
                      {order.shippedAt && (
                        <p>
                          <strong>Shipped:</strong>{' '}
                          {new Date(order.shippedAt).toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="admin-order-details">
                      <p><strong>Ship To:</strong></p>
                      <p>{order.shippingLine1 || 'Address not captured'}</p>
                      {order.shippingLine2 && <p>{order.shippingLine2}</p>}
                      {(order.shippingCity || order.shippingState || order.shippingPostalCode) && (
                        <p>
                          {[order.shippingCity, order.shippingState, order.shippingPostalCode]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                      {order.shippingCountry && <p>{order.shippingCountry}</p>}
                    </div>
                  </div>

                  <div className="admin-order-products">
                    {order.items.map((item) => (
                      <div key={item.id} className="admin-order-product">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="admin-product-thumb"
                        />
                        <div>
                          <p>{item.name}</p>
                          <p>Qty {item.quantity} | ${Number(item.price).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default Admin

