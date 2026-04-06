import { Link } from 'react-router-dom'
import { useCart } from '../context/useCart'

function Cart() {
  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    subtotal,
  } = useCart()

  const shipping = cartItems.length > 0 ? 8 : 0
  const total = subtotal + shipping

  return (
    <section className="section">
      <div className="container">
        <div className="cart-header">
          <div>
            <h1>Your Cart</h1>
            <p className="section-subtext">
              Review your items before checkout.
            </p>
          </div>

          <Link to="/shop" className="cart-continue-link">
            ← Continue Shopping
          </Link>
        </div>

        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <h2>Your cart is empty</h2>
            <p>Looks like you haven’t added anything yet.</p>
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
                    src={item.imageUrl || item.image}
                    alt={item.name}
                    className="cart-item-image"
                  />

                  <div className="cart-item-details">
                    <p className="cart-item-category">{item.category}</p>
                    <h2>{item.name}</h2>
                    <p className="cart-item-price">${item.price}</p>

                    <div className="cart-item-actions">
                      <div className="quantity-control">
                        <button
                          type="button"
                          onClick={() => decreaseQuantity(item.id)}
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => increaseQuantity(item.id)}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
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
                <span>Shipping</span>
                <span>${shipping.toFixed(2)}</span>
              </div>

              <div className="summary-row total-row">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <button className="btn checkout-btn">Proceed to Checkout</button>

              <p className="summary-note">
                Shipping and refund outcomes may vary depending on the item and
                order circumstances.
              </p>
            </aside>
          </div>
        )}
      </div>
    </section>
  )
}

export default Cart