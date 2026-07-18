import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Shop from './pages/Shop'
import Fragrances from './pages/Fragrances'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Support from './pages/Support'
import Policies from './pages/Policies'
import Admin from './pages/Admin'
import CheckoutSuccess from './pages/CheckoutSuccess'
import CheckoutCancel from './pages/CheckoutCancel'

function App() {
  return (
    <div className="app-shell">
      <Header />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/fragrances" element={<Fragrances />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/support" element={<Support />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/login" element={<Admin loginOnly />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/alliesthrone" element={<Navigate to="/login" replace />} />
          <Route path="/checkout-success" element={<CheckoutSuccess />} />
          <Route path="/checkout-cancel" element={<CheckoutCancel />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}

export default App
