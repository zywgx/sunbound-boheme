import { useEffect, useMemo, useState } from 'react'
import CartContext from './CartContext'

// A cart line is identified by product id plus the chosen variant (if any),
// so the same fragrance in two sizes lives on two separate lines.
function buildLineKey(id, variantId) {
  return `${id}::${variantId ?? ''}`
}

// Older saved carts (pre-variants) stored items without a lineKey.
function withLineKey(item) {
  const variantId = item.variantId ?? null
  return {
    ...item,
    variantId,
    lineKey: item.lineKey || buildLineKey(item.id, variantId),
  }
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('sunbound-cart')
    const parsed = savedCart ? JSON.parse(savedCart) : []
    return Array.isArray(parsed) ? parsed.map(withLineKey) : []
  })

  useEffect(() => {
    localStorage.setItem('sunbound-cart', JSON.stringify(cartItems))
  }, [cartItems])

  function addToCart(product, variant = null) {
    setCartItems((prevItems) => {
      const variantId = variant?.id ?? null
      const lineKey = buildLineKey(product.id, variantId)
      const stockLimit = Number(
        variant ? variant.quantity : product.stockQuantity ?? product.quantity ?? 0
      )

      if (stockLimit <= 0) {
        return prevItems
      }

      const existingItem = prevItems.find((item) => item.lineKey === lineKey)

      if (existingItem) {
        if (existingItem.quantity >= existingItem.stockQuantity) {
          return prevItems
        }

        return prevItems.map((item) =>
          item.lineKey === lineKey
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [
        ...prevItems,
        {
          ...product,
          variantId,
          variantLabel: variant?.label ?? null,
          price: Number(variant ? variant.price : product.price),
          stockQuantity: stockLimit,
          quantity: 1,
          lineKey,
        },
      ]
    })
  }

  function increaseQuantity(lineKey) {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.lineKey === lineKey
          ? item.quantity >= item.stockQuantity
            ? item
            : { ...item, quantity: item.quantity + 1 }
          : item
      )
    )
  }

  function decreaseQuantity(lineKey) {
    setCartItems((prevItems) =>
      prevItems
        .map((item) =>
          item.lineKey === lineKey
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  function removeFromCart(lineKey) {
    setCartItems((prevItems) => prevItems.filter((item) => item.lineKey !== lineKey))
  }

  function clearCart() {
    localStorage.removeItem('sunbound-cart')
    setCartItems([])
  }

  const cartCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }, [cartItems])

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    )
  }, [cartItems])

  const value = {
    cartItems,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
    cartCount,
    subtotal,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
