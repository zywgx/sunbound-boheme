import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Shop from './pages/Shop'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Support from './pages/Support'
import Policies from './pages/Policies'
import Admin from './pages/Admin'

function App() {
  return (
    <div className="app-shell">
      <Header />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/support" element={<Support />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}

export default App