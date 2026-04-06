import { useEffect, useMemo, useState } from 'react'
import CartContext from './CartContext'

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('sunbound-cart')
    return savedCart ? JSON.parse(savedCart) : []
  })

  useEffect(() => {
    localStorage.setItem('sunbound-cart', JSON.stringify(cartItems))
  }, [cartItems])

  function addToCart(product) {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id)

      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [...prevItems, { ...product, quantity: 1 }]
    })
  }

  function increaseQuantity(id) {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    )
  }

  function decreaseQuantity(id) {
    setCartItems((prevItems) =>
      prevItems
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  function removeFromCart(id) {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id))
  }

  function clearCart() {
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