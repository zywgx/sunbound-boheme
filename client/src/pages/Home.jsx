import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { buildApiUrl } from '../lib/api'

const API_URL = buildApiUrl('/products')

const collectionHighlights = [
  {
    title: 'Dresses with movement',
    description:
      'Soft silhouettes, earthy prints, and pieces that feel easy from market mornings to dinners out.',
  },
  {
    title: 'Layers with character',
    description:
      'Vintage-washed denim, textured knits, and outerwear that adds story instead of bulk.',
  },
  {
    title: 'Accessories that finish the look',
    description:
      'Woven bags, sun-faded leather, and small details that make an outfit feel collected.',
  },
]

const studioNotes = [
  'Every item is selected for texture, shape, and how easily it works with pieces you already own.',
  'Condition notes stay honest and practical, so the collection feels personal without feeling risky.',
  'Small-batch sourcing keeps the shop fresh and helps each drop feel discovered rather than mass-made.',
]

const shoppingSteps = [
  {
    step: '01',
    title: 'Browse the latest finds',
    description:
      'New arrivals are chosen to mix together naturally, so building a full look feels easy.',
  },
  {
    step: '02',
    title: 'Check the details',
    description:
      'Sizing, condition, and styling notes are there to help you buy with confidence.',
  },
  {
    step: '03',
    title: 'Wear it your way',
    description:
      'Style pieces for travel, everyday layering, and that relaxed golden-hour feeling.',
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
            <p className="eyebrow">Vintage | Boho | Traveler Soul</p>
            <h1>Curated style for warm days, layered stories, and a little wanderlust.</h1>
            <p className="hero-text">
              SUNBOUND BOHEME brings together vintage soul, earthy palettes, and easy statement
              pieces that feel collected over time.
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
                <span>Curated one piece at a time</span>
              </div>

              <div className="hero-stat">
                <strong>Transparent</strong>
                <span>Clear notes on fit and condition</span>
              </div>

              <div className="hero-stat">
                <strong>Boho-rooted</strong>
                <span>Vintage warmth with everyday wearability</span>
              </div>
            </div>
          </div>

          <div className="hero-editorial">
            <div className="hero-atmosphere" aria-hidden="true">
              <div className="hero-orbit hero-orbit-one" />
              <div className="hero-orbit hero-orbit-two" />
              <div className="hero-manifesto">
                <span className="hero-manifesto-label">Sunbound Notes</span>
                <p>Earth tones, collected layers, road-trip denim, and pieces that feel discovered.</p>
              </div>
              <div className="hero-editorial-card">
                <span className="hero-editorial-label">Current Mood</span>
                <h2>For the closet that wants softness, shape, and a little desert drama.</h2>
                <p>
                  Think dresses with movement, layers with history, and accessories that make an
                  outfit feel found rather than finished.
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
              <h2>Built around texture, ease, and lived-in character</h2>
            </div>
          </div>

          <div className="collection-intro">
            <p>
              The collection is built around pieces that play well together: soft structure, earthy
              tones, lived-in character, and styling that feels effortless instead of overworked.
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
                A rotating edit of pieces chosen for texture, movement, and everyday styling.
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
                      A small rotating selection of pieces chosen for styling ease, strong texture,
                      and that slightly cinematic SUNBOUND BOHEME mood.
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
            <h2>A wardrobe that feels collected, not crowded</h2>
            <p className="story-lead">
              The goal is simple: pieces with soul, softness, and enough character to make everyday
              outfits feel a little cinematic.
            </p>

            <div className="story-notes">
              {studioNotes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          </div>

          <div className="story-panel story-accent">
            <p className="story-kicker">
              For the closet that wants to feel sunlit, grounded, and lived in.
            </p>

            <div className="story-quote">
              <span className="quote-mark">"</span>
              <p>
                Think road-trip denim, market bags, soft dresses, and the kind of layers that only
                get better with wear.
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
              <h2>Easy to browse, easy to trust</h2>
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
            <p>Selected with a focus on style, warmth, and character.</p>
          </div>

          <div className="trust-item">
            <h3>Clear Condition Notes</h3>
            <p>We aim to present items honestly and thoughtfully.</p>
          </div>

          <div className="trust-item">
            <h3>Fair Support</h3>
            <p>Every issue is reviewed carefully and case by case.</p>
          </div>
        </div>
      </section>

      <section className="section closing-section">
        <div className="container closing-card">
          <div>
            <p className="section-label">Start Here</p>
            <h2>Browse the collection and find the pieces that feel like you.</h2>
            <p className="section-subtext closing-copy">
              Whether you are building a full boho wardrobe or just looking for one perfect accent,
              the shop is designed to feel approachable, warm, and easy to explore.
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
    </div>
  )
}

export default Home
