import { Link } from 'react-router-dom'
import SunGraphic from './SunGraphic'

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <SunGraphic className="footer-sun" variant="burst" />
        <p>Copyright 2026 SUNBOUND BOHEME | Boho finds, vintage soul, sunlit style.</p>
        <p>
          <Link to="/support">About & Contact</Link> |{' '}
          <Link to="/policies">Policies</Link>
        </p>
      </div>
    </footer>
  )
}

export default Footer
