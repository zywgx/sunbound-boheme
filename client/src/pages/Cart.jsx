import { Link } from 'react-router-dom'
import { useCart } from '../context/useCart'
import { useEffect, useState } from 'react'
import SunGraphic from '../components/SunGraphic'

const DEFAULT_SHIPPING_SETTINGS = {
  free: 0,
  standard: 6.95,
  heavy: 12.95,
  prioritySurcharge: 6,
}
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000').replace(/\/+$/, '')
const STORE_SETTINGS_URL = `${API_BASE_URL}/store-settings`

function Cart() {
  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    subtotal,
  } = useCart()

  const [loading, setLoading] = useState(false)
  const [shippingSettings, setShippingSettings] = useState(DEFAULT_SHIPPING_SETTINGS)

  useEffect(() => {
    async function fetchStoreSettings() {
      try {
        const res = await fetch(STORE_SETTINGS_URL)

        if (!res.ok) {
          return
        }

        const data = await res.json()
        setShippingSettings({
          free: 0,
          standard: Number(data.standardShippingRate),
          heavy: Number(data.heavyShippingRate),
          prioritySurcharge: Number(data.priorityShippingSurcharge),
        })
      } catch {
        // Keep defaults if settings cannot be loaded.
      }
    }

    fetchStoreSettings()
  }, [])

  const standardShippingEstimate = cartItems.reduce((total, item) => {
    const baseRate =
      item.shippingCustomAmount !== null &&
      item.shippingCustomAmount !== undefined &&
      item.shippingCustomAmount !== ''
        ? Number(item.shippingCustomAmount)
        : shippingSettings[item.shippingProfile] ?? shippingSettings.standard

    return total + baseRate * item.quantity
  }, 0)
  const priorityShippingEstimate =
    cartItems.length > 0
      ? standardShippingEstimate + shippingSettings.prioritySurcharge
      : 0
  const estimatedShippingLabel =
    cartItems.length === 0
      ? '$0.00'
      : standardShippingEstimate === 0
        ? `Free standard or $${priorityShippingEstimate.toFixed(2)} priority`
        : `$${standardShippingEstimate.toFixed(2)} standard or $${priorityShippingEstimate.toFixed(2)} priority`
  const estimatedTaxLabel = cartItems.length > 0
    ? 'Finalized during checkout'
    : '$0.00'

  async function handleCheckout() {
    try {
      setLoading(true)
      localStorage.setItem('checkout_cart', JSON.stringify(cartItems))
      localStorage.setItem('checkout_total', JSON.stringify(subtotal))

      const response = await fetch(`${API_BASE_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cartItems }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.')
      }

      window.location.href = data.url
    } catch (error) {
      console.error('Checkout failed:', error)
      alert(error.message || 'Unable to start checkout.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section">
      <div className="container">
        <div className="cart-header">
          <div>
            <SunGraphic className="page-sun" />
            <h1>Your Cart</h1>
            <p className="section-subtext">
              Review your items before checkout.
            </p>
          </div>

          <Link to="/shop" className="cart-continue-link">
            {'<- Continue Shopping'}
          </Link>
        </div>

        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything yet.</p>
            <Link to="/shop" className="btn">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item-card">
                  <img
                    src={item.image || item.imageUrl}
                    alt={item.name}
                    className="cart-item-image"
                  />

                  <div className="cart-item-details">
                    <p className="cart-item-category">{item.category}</p>
                    <h2>{item.name}</h2>
                    <p className="cart-item-price">${item.price}</p>

                    <div className="cart-item-actions">
                      <div className="quantity-control">
                        <button onClick={() => decreaseQuantity(item.id)}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => increaseQuantity(item.id)}>+</button>
                      </div>

                      <button
                        className="remove-btn"
                        onClick={() => removeFromCart(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="cart-item-total">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <aside className="cart-summary">
              <h2>Order Summary</h2>

              <div className="summary-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              <div className="summary-row">
                <span>Estimated Shipping</span>
                <span>{estimatedShippingLabel}</span>
              </div>

              <div className="summary-row">
                <span>Estimated Tax</span>
                <span>{estimatedTaxLabel}</span>
              </div>

              <div className="summary-row total-row">
                <span>Items Total</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              <button
                className="btn checkout-btn"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? 'Redirecting...' : 'Proceed to Checkout'}
              </button>

              <p className="summary-note">
                Stripe will show your shipping choice and any final checkout
                adjustments before payment. Each product can now carry its own
                shipping setting from the admin panel.
              </p>
            </aside>
          </div>
        )}
      </div>
    </section>
  )
}

export default Cart
