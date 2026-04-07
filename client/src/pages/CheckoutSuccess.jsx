import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { useCart } from '../context/useCart'
import { buildApiUrl } from '../lib/api'

function CheckoutSuccess() {
  const { clearCart } = useCart()
  const hasSaved = useRef(false)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    async function saveOrder() {
      if (hasSaved.current) return
      hasSaved.current = true

      try {
        const storedCart = JSON.parse(localStorage.getItem('checkout_cart') || '[]')
        const storedTotal = JSON.parse(localStorage.getItem('checkout_total') || '0')
        const checkoutSessionId = searchParams.get('session_id')

        if (!storedCart.length) return

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

        localStorage.removeItem('checkout_cart')
        localStorage.removeItem('checkout_total')

        clearCart()
      } catch (error) {
        console.error('Order save failed:', error)
      }
    }

    saveOrder()
  }, [clearCart, searchParams])

  return (
    <section className="section">
      <div className="container">
        <h1>Payment Successful</h1>
        <p className="section-subtext">
          Thank you for your order. A confirmation email is on the way, and we will reach out
          again if there is a shipping or fulfillment update.
        </p>

        <Link to="/shop" className="btn">
          Back to the Collection
        </Link>
      </div>
    </section>
  )
}

export default CheckoutSuccess
