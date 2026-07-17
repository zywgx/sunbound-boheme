import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import SunGraphic from '../components/SunGraphic'
import RoadtripScene from '../components/RoadtripScene'
import { buildApiUrl } from '../lib/api'

const API_URL = buildApiUrl('/products')

const collectionHighlights = [
  {
    title: 'Iconic Dresses',
    description:
      'Statement silhouettes and dreamy shapes made to stand out at your next event.',
  },
  {
    title: 'Road-trip Denims',
    description:
      'Worn-in denim and easy layers with that festival-road-trip energy already built in.',
  },
  {
    title: 'Statement Skirts',
    description:
      'Pieces with movement, shape, and personality that make the rest of the outfit easy.',
  },
  {
    title: 'Effortless Styles',
    description:
      'Curated second-hand looks that feel wild, free, and easy to wear without looking ordinary.',
  },
]

const studioNotes = [
  'Curated second-hand styles fit for the dreamers, with pieces chosen to bring personality to your closet.',
  'Inspired by vintage silhouettes and earth toned palettes, the collection is built to feel both expressive and wearable.',
  'Every find is selected to help you look like a dime while saving a dime.',
]

const shoppingSteps = [
  {
    step: '01',
    title: 'Pick your favorites',
    description:
      'Browse the latest drop of second-hand pieces and find the looks that fit your next event or everyday mood.',
  },
  {
    step: '02',
    title: 'Check the notes',
    description:
      'Sizing, condition, and styling details are there to keep the shopping experience easy and transparent.',
  },
  {
    step: '03',
    title: 'Dress the dreamers',
    description:
      'Style your pieces your way, whether you are headed to a festival, a trip, or your next standout night out.',
  },
]

function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch(API_URL)
        const data = await res.json()
        setProducts(data.slice(0, 4))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return (
    <div>
      <section className="hero">
        <div className="container hero-layout">
          <div className="hero-content">
            <p className="eyebrow">Festival | Bohemian | Wanderlust | Wild &amp; Free</p>
            <h1>Curated second-hand styles fit for the dreamers.</h1>
            <p className="hero-text">
              SUNBOUND BOHEME is inspired by vintage silhouettes and earth toned palettes,
              offering unique pieces that will pop at your next event.
            </p>

            <div className="hero-actions">
              <Link to="/shop" className="btn">
                Shop Collection
              </Link>

              <Link to="/support" className="btn btn-outline">
                About & Contact
              </Link>
            </div>

            <div className="hero-stats">
              <div className="hero-stat">
                <strong>Small-batch</strong>
                <span>Curated second-hand styles for the dreamers</span>
              </div>

              <div className="hero-stat">
                <strong>Wanderlust</strong>
                <span>Vintage-inspired pieces with festival energy</span>
              </div>

              <div className="hero-stat">
                <strong>Wild &amp; Free</strong>
                <span>Styles that pop while still feeling effortless</span>
              </div>
            </div>
          </div>

          <div className="hero-editorial">
            <div className="hero-atmosphere" aria-hidden="true">
              <div className="hero-orbit hero-orbit-one" />
              <div className="hero-orbit hero-orbit-two" />
              <SunGraphic className="hero-sun hero-sun-one" rays={16} />
              <SunGraphic className="hero-sun hero-sun-two" rays={12} />
              <div className="hero-manifesto">
                <span className="hero-manifesto-label">Sunbound Notes</span>
                <p>
                  Earth tones, boho style, repurposed, traveller soul, discounted pieces from your
                  favorite brands.
                </p>
              </div>
              <div className="hero-editorial-card">
                <span className="hero-editorial-label">Current Mood</span>
                <h2>For the shoppers who want to look like a dime, while saving a dime.</h2>
                <p>
                  Unique second-hand pieces with vintage soul, bohemian energy, and enough pop to
                  make the next outfit feel like an event.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section collection-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="section-label">Collection Focus</p>
              <h2>Repurposed style that feels expressive, wearable, and worth discovering</h2>
            </div>
          </div>

          <div className="collection-intro">
            <p>
              The collection is built around repurposing curated, second-hand pieces from brands
              you love. Resale fashion is sustainable for both our environment and our wallets.
              If this interests you, join SUNBOUND BOHEME in dressing the dreamers by picking out
              your favorite pieces in our collection.
            </p>
          </div>

          <div className="feature-grid">
            {collectionHighlights.map((highlight) => (
              <article key={highlight.title} className="feature-box collection-card">
                <h3>{highlight.title}</h3>
                <p>{highlight.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section featured-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="section-label">Featured</p>
              <h2>Featured Products</h2>
              <p className="section-subtext">
                A rotating edit of hand picked pieces, perfect for anyone looking to try new styles
                or elevate looks you already have.
              </p>
            </div>

            <Link to="/shop" className="btn btn-secondary">
              View All Products
            </Link>
          </div>

          {loading ? (
            <p>Loading products...</p>
          ) : (
            <>
              {products.length > 0 ? (
                <div className="featured-callout">
                <div>
                  <span className="featured-callout-label">Freshly Curated</span>
                  <p>
                      A rotating mix of second-hand finds with boho spirit, vintage shape, and the
                      kind of personality that makes getting dressed more fun.
                    </p>
                  </div>
                  <Link to="/shop" className="btn btn-outline">
                    Browse the Full Edit
                  </Link>
                </div>
              ) : null}

              <div className="product-grid">
                {products.length > 0 ? (
                products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <p className="section-subtext">
                  New arrivals are being prepared now. Check back soon for the next curated drop.
                </p>
              )}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="section story-section">
        <div className="container story-grid">
          <div className="story-panel story-copy">
            <p className="section-label">The Mood</p>
            <h2>For dreamers, event-goers, and anyone chasing a little more personality</h2>
            <p className="story-lead">
              The goal is simple: bring together second-hand pieces that feel bold, wearable,
              and a little bit wanderlust.
            </p>

            <div className="story-notes">
              {studioNotes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          </div>

          <div className="story-panel story-accent">
            <p className="story-kicker">
              For the shoppers who want standout style without paying standout prices.
            </p>

            <div className="story-quote">
              <span className="quote-mark">"</span>
              <p>
                Think iconic dresses, road-trip denims, statement skirts, and effortless styles
                built to dress the dreamers.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section process-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="section-label">How It Works</p>
              <h2>Easy to browse, easy to fall for</h2>
            </div>
          </div>

          <div className="process-grid">
            {shoppingSteps.map((item) => (
              <article key={item.step} className="process-card">
                <span className="process-step">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section trust-section">
        <div className="container trust-grid">
          <div className="trust-item">
            <h3>Curated Pieces</h3>
            <p>Selected for personality, movement, and standout style.</p>
          </div>

          <div className="trust-item">
            <h3>Clear Condition Notes</h3>
            <p>Every piece is presented honestly so shopping second-hand still feels easy.</p>
          </div>

          <div className="trust-item">
            <h3>Dreamer Energy</h3>
            <p>Vintage silhouettes, earth tones, and event-ready pieces with a free spirit.</p>
          </div>
        </div>
      </section>

      <section className="section closing-section">
        <div className="container closing-card">
          <div>
            <p className="section-label">Start Here</p>
            <h2>Browse the collection and find the pieces that make your next look pop.</h2>
            <p className="section-subtext closing-copy">
              Whether you are styling for an event, a trip, or just want a wardrobe with more
              personality, the collection is built to help you dress the dreamers.
            </p>
          </div>

          <div className="closing-actions">
            <Link to="/shop" className="btn">
              Explore the Shop
            </Link>
            <Link to="/policies" className="btn btn-secondary">
              Read Policies
            </Link>
          </div>
        </div>
      </section>

      <section className="roadtrip-section" aria-hidden="true">
        <RoadtripScene />
      </section>
    </div>
  )
}

export default Home
