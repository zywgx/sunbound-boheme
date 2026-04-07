import { Link } from 'react-router-dom'

function CheckoutCancel() {
  return (
    <section className="section">
      <div className="container checkout-state-shell">
        <div className="checkout-state-card checkout-state-card-cancel">
          <p className="section-label">Checkout Paused</p>
          <h1>Checkout Cancelled</h1>
          <p className="section-subtext">
            Your payment was not completed, and no order was created. Your cart is still waiting
            if you would like to try again.
          </p>

          <div className="checkout-state-notes">
            <div className="checkout-state-note">
              <strong>Your cart is still there</strong>
              <span>You can go back, review the order, and retry whenever you are ready.</span>
            </div>
          </div>

          <div className="closing-actions">
            <Link to="/cart" className="btn">
              Return to Cart
            </Link>
            <Link to="/shop" className="btn btn-outline">
              Keep Browsing
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CheckoutCancel
