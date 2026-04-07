import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { useCart } from '../context/useCart'
import { buildApiUrl } from '../lib/api'

function CheckoutSuccess() {
  const { clearCart } = useCart()
  const hasSaved = useRef(false)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    function clearCheckoutState() {
      localStorage.removeItem('checkout_cart')
      localStorage.removeItem('checkout_total')
      localStorage.removeItem('sunbound-cart')
      clearCart()
    }

    async function saveOrder() {
      if (hasSaved.current) return
      hasSaved.current = true

      try {
        const storedCart = JSON.parse(localStorage.getItem('checkout_cart') || '[]')
        const storedTotal = JSON.parse(localStorage.getItem('checkout_total') || '0')
        const checkoutSessionId = searchParams.get('session_id')

        if (!checkoutSessionId) return

        if (!storedCart.length) {
          clearCheckoutState()
          return
        }

        const response = await fetch(buildApiUrl('/orders'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cartItems: storedCart,
            total: storedTotal,
            checkoutSessionId,
          }),
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || 'Could not save the order.')
        }

        clearCheckoutState()
      } catch (error) {
        console.error('Order save failed:', error)
      }
    }

    saveOrder()
  }, [clearCart, searchParams])

  return (
    <section className="section">
      <div className="container checkout-state-shell">
        <div className="checkout-state-card">
          <p className="section-label">Order Confirmed</p>
          <h1>Payment Successful</h1>
          <p className="section-subtext">
            Thank you for your order. A confirmation email is on the way, and we will reach out
            again if there is a shipping or fulfillment update.
          </p>

          <div className="checkout-state-notes">
            <div className="checkout-state-note">
              <strong>What happens next</strong>
              <span>Your order is now in the admin dashboard for packing and fulfillment.</span>
            </div>
            <div className="checkout-state-note">
              <strong>Email updates</strong>
              <span>You will receive a confirmation now and shipping details once available.</span>
            </div>
          </div>

          <div className="closing-actions">
            <Link to="/shop" className="btn">
              Back to the Collection
            </Link>
            <Link to="/support" className="btn btn-outline">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CheckoutSuccess
