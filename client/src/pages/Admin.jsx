import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { buildApiUrl } from '../lib/api'
import { isFragranceProduct } from '../utils/productDisplay'

const API_URL = buildApiUrl('/products')
const ORDERS_URL = buildApiUrl('/orders')
const AUTH_URL = buildApiUrl('/auth')
const STORE_SETTINGS_URL = buildApiUrl('/store-settings')
const DASHBOARD_URL = buildApiUrl('/dashboard')
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
const SIZE_OPTIONS = [
  'One Size',
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  '0',
  '2',
  '4',
  '6',
  '8',
  '10',
  '12',
  '14',
  '16',
]
const CLOUDINARY_CLOUD_NAME = 'dbil6mtce'
const CLOUDINARY_UPLOAD_PRESET = 'sunbound_products'
const DEFAULT_SHIPPING_SETTINGS = {
  standardShippingRate: 6.95,
  heavyShippingRate: 12.95,
  priorityShippingSurcharge: 6,
}
const DEFAULT_DASHBOARD = {
  grossSales: 0,
  totalOrders: 0,
  averageOrderValue: 0,
  salesThisWeek: 0,
  salesThisMonth: 0,
  statusCounts: {
    new: 0,
    fulfilled: 0,
    shipped: 0,
  },
  recentSales: [],
  topProducts: [],
}

function formatOrderStatus(status) {
  return ORDER_STATUS_OPTIONS.find((option) => option.value === status)?.label || status || 'New'
}

const emptyForm = {
  name: '',
  price: '',
  description: '',
  imageUrl: '',
  galleryImages: [],
  category: '',
  size: '',
  customSize: '',
  slug: '',
  quantity: '',
  shippingProfile: 'standard',
  shippingCustomAmount: '',
  isFragrance: false,
  brand: '',
  fragranceType: '',
  authenticityNote: '',
  occasion: '',
  variants: [],
}

const OCCASION_OPTIONS = [
  'Daily driver',
  'Date night',
  'Summer scents',
  'Winter scents',
  'Value / dupes',
]

const emptyVariant = { label: '', price: '', quantity: '' }

function Admin({ loginOnly = false }) {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [storeSettings, setStoreSettings] = useState(DEFAULT_SHIPPING_SETTINGS)
  const [settingsForm, setSettingsForm] = useState(DEFAULT_SHIPPING_SETTINGS)
  const [dashboard, setDashboard] = useState(DEFAULT_DASHBOARD)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [dashboardLoading, setDashboardLoading] = useState(true)
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
  const lowStockCount = products.filter((product) => Number(product.quantity) <= 1).length
  const totalUnits = products.reduce((sum, product) => sum + Number(product.quantity || 0), 0)

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
      setDashboardLoading(false)
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
    await Promise.all([
      fetchProducts(),
      fetchOrders(),
      fetchStoreSettings(),
      fetchDashboardMetrics(),
    ])
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

  function isFragranceCatalogItem(product) {
    return isFragranceProduct(product)
  }

  function resolveSizeFormFields(sizeValue = '') {
    if (!sizeValue) {
      return {
        size: '',
        customSize: '',
      }
    }

    if (SIZE_OPTIONS.includes(sizeValue)) {
      return {
        size: sizeValue,
        customSize: '',
      }
    }

    return {
      size: 'custom',
      customSize: sizeValue,
    }
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

  async function fetchDashboardMetrics() {
    try {
      setDashboardLoading(true)
      const res = await fetch(DASHBOARD_URL, {
        credentials: 'include',
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      if (!res.ok) {
        throw new Error('Failed to load dashboard metrics')
      }

      const data = await res.json()
      setDashboard({
        ...DEFAULT_DASHBOARD,
        ...data,
        statusCounts: {
          ...DEFAULT_DASHBOARD.statusCounts,
          ...(data.statusCounts || {}),
        },
      })
    } catch (err) {
      setError(err.message || 'Could not load dashboard metrics')
    } finally {
      setDashboardLoading(false)
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

  function handleRemoveGalleryImage(indexToRemove) {
    setForm((prev) => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, index) => index !== indexToRemove),
    }))
  }

  function handleSetCoverImage(imageUrl) {
    setForm((prev) => {
      const nextGalleryImages = [
        prev.imageUrl,
        ...prev.galleryImages,
      ].filter((url) => url && url !== imageUrl)

      return {
        ...prev,
        imageUrl,
        galleryImages: nextGalleryImages,
      }
    })
  }

  function handleSettingsChange(e) {
    const { name, value } = e.target
    setSettingsForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function handleEdit(product) {
    const productVariants = Array.isArray(product.variants) ? product.variants : []
    setEditingId(product.id)
    setForm({
      name: product.name || '',
      price: product.price ?? '',
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      galleryImages: Array.isArray(product.galleryImages) ? product.galleryImages : [],
      category: product.category || '',
      ...resolveSizeFormFields(product.size || ''),
      slug: product.slug || '',
      quantity: product.quantity ?? '',
      shippingProfile: product.shippingProfile || 'standard',
      shippingCustomAmount: product.shippingCustomAmount ?? '',
      isFragrance: isFragranceCatalogItem(product),
      brand: product.brand || '',
      fragranceType: product.fragranceType || '',
      authenticityNote: product.authenticityNote || '',
      occasion: product.occasion || '',
      variants: productVariants.map((variant) => ({
        label: variant.label || '',
        price: variant.price ?? '',
        quantity: variant.quantity ?? '',
      })),
    })
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleToggleFragrance(e) {
    const checked = e.target.checked
    setForm((prev) => ({
      ...prev,
      isFragrance: checked,
      variants: checked && prev.variants.length === 0 ? [{ ...emptyVariant }] : prev.variants,
    }))
  }

  function handleVariantChange(index, field, value) {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant
      ),
    }))
  }

  function addVariantRow() {
    setForm((prev) => ({ ...prev, variants: [...prev.variants, { ...emptyVariant }] }))
  }

  function removeVariantRow(index) {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }))
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
      setDashboard(DEFAULT_DASHBOARD)
      setError('')
      window.dispatchEvent(new Event('admin-auth-changed'))
    }
  }

  function handleUnauthorized() {
    setAuthenticated(false)
    setProducts([])
    setOrders([])
    setDashboard(DEFAULT_DASHBOARD)
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
        multiple: true,
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
            imageUrl: prev.imageUrl || result.info.secure_url,
            galleryImages: prev.imageUrl
              ? [...prev.galleryImages, result.info.secure_url]
              : prev.galleryImages,
          }))
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

    // Fragrances price/stock come from their sizes; normal items use the base fields.
    const cleanedVariants = form.isFragrance
      ? form.variants
          .map((variant) => ({
            label: String(variant.label || '').trim(),
            price: Number(variant.price),
            quantity: Number.parseInt(variant.quantity, 10),
          }))
          .filter(
            (variant) =>
              variant.label &&
              Number.isFinite(variant.price) &&
              variant.price >= 0 &&
              Number.isInteger(variant.quantity) &&
              variant.quantity >= 0
          )
      : []

    const baseFieldsRequired = !form.isFragrance

    if (
      !form.name.trim() ||
      !form.description.trim() ||
      !form.imageUrl.trim() ||
      !form.category.trim() ||
      (baseFieldsRequired && (!form.price || form.quantity === ''))
    ) {
      setError('Please fill out all fields.')
      return
    }

    if (form.isFragrance && cleanedVariants.length === 0) {
      setError('Add at least one size (label, price, and stock) for this fragrance.')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const payload = {
        name: form.name.trim(),
        price: form.price === '' ? 0 : Number(form.price),
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
        galleryImages: form.galleryImages,
        category: form.category.trim(),
        size: (form.size === 'custom' ? form.customSize : form.size).trim() || null,
        slug: form.slug.trim(),
        quantity: form.quantity === '' ? 0 : Number(form.quantity),
        shippingProfile: form.shippingProfile,
        shippingCustomAmount:
          form.shippingCustomAmount === ''
            ? null
            : Number(form.shippingCustomAmount),
        brand: form.isFragrance ? form.brand.trim() : null,
        fragranceType: form.isFragrance ? form.fragranceType.trim() : null,
        authenticityNote: form.isFragrance ? form.authenticityNote.trim() : null,
        occasion: form.isFragrance ? form.occasion.trim() : null,
        variants: cleanedVariants,
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

  if (!authenticated && !loginOnly) {
    return <Navigate to="/login" replace />
  }

  if (authenticated && loginOnly) {
    return <Navigate to="/admin" replace />
  }

  if (!authenticated) {
    return (
      <section className="section">
        <div className="container admin-login-shell">
          <div className="admin-login-card">
            <p className="section-label">Admin Login</p>
            <h1>Sign in to manage products</h1>
            <p className="section-subtext">
              Sign in with your family admin password to manage products, orders, and uploads.
            </p>

            <div className="admin-login-notes">
              <div className="admin-login-note">
                <strong>Products</strong>
                <span>Add or edit pieces with image upload built in.</span>
              </div>
              <div className="admin-login-note">
                <strong>Orders</strong>
                <span>Review purchases, tracking, notes, and shipping details.</span>
              </div>
            </div>

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
          <div className="admin-header-copy">
            <p className="section-label">Private Admin</p>
            <h1>Manage products</h1>
            <p className="section-subtext">
              Add new products, upload images from your computer, and keep the shop updated without
              needing image URLs by hand.
            </p>

            <div className="admin-overview-grid">
              <div className="admin-overview-card">
                <span className="admin-overview-label">Live products</span>
                <strong>{products.length}</strong>
              </div>
              <div className="admin-overview-card">
                <span className="admin-overview-label">Units listed</span>
                <strong>{totalUnits}</strong>
              </div>
              <div className="admin-overview-card">
                <span className="admin-overview-label">Recent orders</span>
                <strong>{orders.length}</strong>
              </div>
              <div className="admin-overview-card">
                <span className="admin-overview-label">Low stock</span>
                <strong>{lowStockCount}</strong>
              </div>
            </div>
          </div>

          <button type="button" className="btn btn-outline" onClick={handleLogout}>
            Log Out
          </button>
        </div>

        {error && <p className="admin-error">{error}</p>}

        <div className="admin-card admin-dashboard-card">
          <div className="admin-orders-header">
            <div>
              <p className="section-label">Dashboard</p>
              <h2>Sales and metrics</h2>
              <p className="admin-card-kicker">
                A quick snapshot of revenue, order flow, and what is selling best.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline"
              onClick={fetchDashboardMetrics}
              disabled={dashboardLoading}
            >
              {dashboardLoading ? 'Refreshing...' : 'Refresh Metrics'}
            </button>
          </div>

          {dashboardLoading ? (
            <p>Loading dashboard...</p>
          ) : (
            <>
              <div className="admin-metrics-grid">
                <div className="admin-metric-card">
                  <span className="admin-metric-label">Gross sales</span>
                  <strong>${Number(dashboard.grossSales).toFixed(2)}</strong>
                </div>
                <div className="admin-metric-card">
                  <span className="admin-metric-label">Orders</span>
                  <strong>{dashboard.totalOrders}</strong>
                </div>
                <div className="admin-metric-card">
                  <span className="admin-metric-label">Average order</span>
                  <strong>${Number(dashboard.averageOrderValue).toFixed(2)}</strong>
                </div>
                <div className="admin-metric-card">
                  <span className="admin-metric-label">This week</span>
                  <strong>${Number(dashboard.salesThisWeek).toFixed(2)}</strong>
                </div>
                <div className="admin-metric-card">
                  <span className="admin-metric-label">This month</span>
                  <strong>${Number(dashboard.salesThisMonth).toFixed(2)}</strong>
                </div>
              </div>

              <div className="admin-dashboard-layout">
                <div className="admin-dashboard-panel">
                  <div className="admin-panel-heading">
                    <h3>Order status</h3>
                    <p>See what still needs attention.</p>
                  </div>

                  <div className="admin-status-grid">
                    <div className="admin-status-card">
                      <span>New</span>
                      <strong>{dashboard.statusCounts.new}</strong>
                    </div>
                    <div className="admin-status-card">
                      <span>Fulfilled</span>
                      <strong>{dashboard.statusCounts.fulfilled}</strong>
                    </div>
                    <div className="admin-status-card">
                      <span>Shipped</span>
                      <strong>{dashboard.statusCounts.shipped}</strong>
                    </div>
                  </div>
                </div>

                <div className="admin-dashboard-panel">
                  <div className="admin-panel-heading">
                    <h3>Recent sales</h3>
                    <p>Last 7 days of revenue.</p>
                  </div>

                  {dashboard.recentSales.length === 0 ? (
                    <p>No sales data yet.</p>
                  ) : (
                    <div className="admin-sales-strip">
                      {dashboard.recentSales.map((point) => (
                        <div key={point.date} className="admin-sales-day">
                          <span>{point.label}</span>
                          <strong>${Number(point.total).toFixed(2)}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="admin-dashboard-panel admin-dashboard-panel-wide">
                  <div className="admin-panel-heading">
                    <h3>Top products</h3>
                    <p>Best sellers by quantity sold.</p>
                  </div>

                  {dashboard.topProducts.length === 0 ? (
                    <p>No product sales yet.</p>
                  ) : (
                    <div className="admin-top-products">
                      {dashboard.topProducts.map((product) => (
                        <div
                          key={`${product.productId || 'name'}-${product.name}`}
                          className="admin-top-product"
                        >
                          <div>
                            <strong>{product.name}</strong>
                            <p>{product.category}</p>
                          </div>
                          <div className="admin-top-product-metrics">
                            <span>{product.quantitySold} sold</span>
                            <strong>${Number(product.revenue).toFixed(2)}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="admin-layout">
          <div className="admin-card">
            <div className="admin-card-heading">
              <div>
                <p className="section-label">{editingId ? 'Editing' : 'Catalog'}</p>
                <h2>{editingId ? 'Edit Product' : 'Add Product'}</h2>
              </div>
              <p className="admin-card-kicker">
                Keep listings clean, consistent, and easy for shoppers to scan.
              </p>
            </div>

            <form className="admin-form" onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Product name"
                value={form.name}
                onChange={handleChange}
              />

              {!form.isFragrance && (
                <input
                  type="number"
                  name="price"
                  placeholder="Price"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                />
              )}

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

              <label className="admin-fragrance-toggle">
                <input
                  type="checkbox"
                  checked={form.isFragrance}
                  onChange={handleToggleFragrance}
                />
                <span>This is a fragrance (sell by size / decant)</span>
              </label>

              {form.isFragrance && (
                <div className="admin-fragrance-fields">
                  <label className="admin-field-group">
                    <span>Fragrance house / brand</span>
                    <input
                      type="text"
                      name="brand"
                      placeholder="Example: Maison Margiela"
                      value={form.brand}
                      onChange={handleChange}
                    />
                  </label>

                  <label className="admin-field-group">
                    <span>Type</span>
                    <select
                      name="fragranceType"
                      value={form.fragranceType}
                      onChange={handleChange}
                    >
                      <option value="Decant">Decant</option>
                    </select>
                  </label>

                  <label className="admin-field-group">
                    <span>Occasion (for "The shelf")</span>
                    <select
                      name="occasion"
                      value={form.occasion}
                      onChange={handleChange}
                    >
                      <option value="">Not categorized</option>
                      {OCCASION_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="admin-field-group">
                    <span>Authenticity / decant note (optional)</span>
                    <textarea
                      name="authenticityNote"
                      placeholder="Example: Decanted from an authentic retail bottle into a labeled glass atomizer."
                      value={form.authenticityNote}
                      onChange={handleChange}
                      rows={2}
                    />
                  </label>

                  <div className="admin-variant-editor">
                    <span className="admin-variant-title">Sizes & prices</span>
                    {form.variants.map((variant, index) => (
                      <div key={index} className="admin-variant-row">
                        <input
                          type="text"
                          placeholder="Size (e.g. 5ml)"
                          value={variant.label}
                          onChange={(e) => handleVariantChange(index, 'label', e.target.value)}
                        />
                        <input
                          type="number"
                          placeholder="Price"
                          min="0"
                          step="0.01"
                          value={variant.price}
                          onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                        />
                        <input
                          type="number"
                          placeholder="Stock"
                          min="0"
                          value={variant.quantity}
                          onChange={(e) => handleVariantChange(index, 'quantity', e.target.value)}
                        />
                        <button
                          type="button"
                          className="admin-variant-remove"
                          onClick={() => removeVariantRow(index)}
                          aria-label="Remove size"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    <button type="button" className="admin-variant-add" onClick={addVariantRow}>
                      + Add another size
                    </button>
                  </div>
                </div>
              )}

              {!form.isFragrance && (
                <>
                  <label className="admin-field-group">
                    <span>Size</span>
                    <select
                      name="size"
                      value={form.size}
                      onChange={handleChange}
                    >
                      <option value="">No size / not listed</option>
                      {SIZE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                      <option value="custom">Custom size label</option>
                    </select>
                  </label>

                  {form.size === 'custom' && (
                    <label className="admin-field-group">
                      <span>Custom size label</span>
                      <input
                        type="text"
                        name="customSize"
                        placeholder="Example: 27 waist or Petite Small"
                        value={form.customSize}
                        onChange={handleChange}
                      />
                    </label>
                  )}
                </>
              )}

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

              {!form.isFragrance && (
                <input
                  type="number"
                  name="quantity"
                  placeholder="Quantity"
                  min="0"
                  value={form.quantity}
                  onChange={handleChange}
                />
              )}

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
                    placeholder="Cover image URL appears here after upload"
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
                      ? 'Upload Images'
                      : 'Loading Upload Tool...'}
                  </button>
                </div>

                {form.imageUrl && (
                  <div className="admin-gallery-section">
                    <div className="admin-gallery-header">
                      <div>
                        <strong>Cover image</strong>
                        <p>This is the main image shoppers see first.</p>
                      </div>
                    </div>

                    <div className="admin-cover-preview-wrap">
                      <img
                        src={form.imageUrl}
                        alt="Selected product"
                        className="admin-upload-preview"
                      />
                    </div>
                  </div>
                )}

                {form.galleryImages.length > 0 && (
                  <div className="admin-gallery-section">
                    <div className="admin-gallery-header">
                      <div>
                        <strong>Gallery images</strong>
                        <p>Extra product images for the product page gallery.</p>
                      </div>
                    </div>

                    <div className="admin-gallery-grid">
                      {form.galleryImages.map((imageUrl, index) => (
                        <div key={`${imageUrl}-${index}`} className="admin-gallery-item">
                          <img
                            src={imageUrl}
                            alt={`Gallery ${index + 1}`}
                            className="admin-gallery-preview"
                          />

                          <div className="admin-gallery-actions">
                            <button
                              type="button"
                              className="btn btn-outline"
                              onClick={() => handleSetCoverImage(imageUrl)}
                            >
                              Make Cover
                            </button>

                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => handleRemoveGalleryImage(index)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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
            <div className="admin-card-heading">
              <div>
                <p className="section-label">Catalog</p>
                <h2>Current Products</h2>
              </div>
              <p className="admin-card-kicker">Quick edit access for everything currently live.</p>
            </div>

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
                      {isFragranceCatalogItem(product) && product.brand && (
                        <p>House: {product.brand}</p>
                      )}
                      {isFragranceCatalogItem(product) && product.occasion && (
                        <p>Occasion: {product.occasion}</p>
                      )}
                      {product.size && <p>Size: {product.size}</p>}
                      {product.slug && <p>Slug: {product.slug}</p>}
                      <p>${Number(product.price).toFixed(2)}</p>
                      <p>Qty: {product.quantity}</p>
                      {Array.isArray(product.variants) && product.variants.length > 0 && (
                        <p>
                          Sizes:{' '}
                          {product.variants
                            .map(
                              (variant) =>
                                variant.label +
                                ' ($' +
                                Number(variant.price).toFixed(2) +
                                ', qty ' +
                                variant.quantity +
                                ')'
                            )
                            .join(' | ')}
                        </p>
                      )}
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
              <p className="admin-card-kicker">
                Adjust your standard shipping buckets without touching code.
              </p>
            </div>
          </div>

          <form className="admin-settings-form" onSubmit={handleSaveShippingSettings}>
            <div className="admin-settings-grid">
              <label className="admin-settings-tile">
                <span className="admin-settings-eyebrow">Everyday</span>
                <strong>Standard shipping</strong>
                <p>Default rate for most pieces and simple orders.</p>
                <div className="admin-settings-input-wrap">
                  <span>$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="standardShippingRate"
                    value={settingsForm.standardShippingRate}
                    onChange={handleSettingsChange}
                  />
                </div>
              </label>

              <label className="admin-settings-tile">
                <span className="admin-settings-eyebrow">Oversized</span>
                <strong>Heavy shipping</strong>
                <p>Use this for bulkier, weightier, or more expensive-to-ship items.</p>
                <div className="admin-settings-input-wrap">
                  <span>$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="heavyShippingRate"
                    value={settingsForm.heavyShippingRate}
                    onChange={handleSettingsChange}
                  />
                </div>
              </label>

              <label className="admin-settings-tile">
                <span className="admin-settings-eyebrow">Upgrade</span>
                <strong>Priority add-on</strong>
                <p>Extra amount added on top of standard shipping for faster delivery.</p>
                <div className="admin-settings-input-wrap">
                  <span>$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="priorityShippingSurcharge"
                    value={settingsForm.priorityShippingSurcharge}
                    onChange={handleSettingsChange}
                  />
                </div>
              </label>
            </div>

            <div className="admin-settings-footer">
              <div className="admin-settings-summary">
                <span className="admin-settings-summary-label">Current checkout options</span>
                <p>
                  Standard <strong>${Number(settingsForm.standardShippingRate).toFixed(2)}</strong>
                  {' '}| Heavy <strong>${Number(settingsForm.heavyShippingRate).toFixed(2)}</strong>
                  {' '}| Priority adds <strong>${Number(settingsForm.priorityShippingSurcharge).toFixed(2)}</strong>
                </p>
              </div>

              <button className="btn" type="submit" disabled={settingsSaving}>
                {settingsSaving ? 'Saving Rates...' : 'Save Shipping Rates'}
              </button>
            </div>
          </form>
        </div>

        <div className="admin-card admin-orders-card">
          <div className="admin-orders-header">
            <div>
              <p className="section-label">Orders</p>
              <h2>Recent purchases</h2>
              <p className="admin-card-kicker">
                Track fulfillment, shipping details, and customer follow-up in one place.
              </p>
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
                    <div className="admin-order-summary-main">
                      <h3>Order #{order.id}</h3>
                      <p>{new Date(order.createdAt).toLocaleString()}</p>
                      <div className="admin-order-badges">
                        <span className={`admin-status-pill admin-status-pill-${order.status || 'new'}`}>
                          {formatOrderStatus(order.status)}
                        </span>
                        <span className="admin-order-chip">{order.items.length} item{order.items.length === 1 ? '' : 's'}</span>
                      </div>
                    </div>

                    <div className="admin-order-total">
                      <span>Total</span>
                      <strong>${Number(order.total).toFixed(2)}</strong>
                    </div>
                  </div>

                  <div className="admin-order-meta">
                    <div className="admin-order-details">
                      <span className="admin-order-section-label">Customer</span>
                      <p><strong>{order.customerName || 'Not captured'}</strong></p>
                      <p>{order.customerEmail || 'Not captured'}</p>
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
                      <span className="admin-order-section-label">Shipping address</span>
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
                      <span className="admin-order-section-label">Update order</span>

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

