import { Link } from 'react-router-dom'

function CheckoutCancel() {
  return (
    <section className="section">
      <div className="container">
        <h1>Checkout Cancelled</h1>
        <p className="section-subtext">
          Your payment was not completed, and no order was created. Your cart is still waiting if
          you would like to try again.
        </p>
        <Link to="/cart" className="btn">
          Return to Cart
        </Link>
      </div>
    </section>
  )
}

export default CheckoutCancel
