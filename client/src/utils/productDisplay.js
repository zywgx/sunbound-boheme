import fragranceArt from '../data/fragrance-art.json'

export const FALLBACK_PRODUCT_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800">
      <rect width="600" height="800" fill="#f2e6d7"/>
      <rect x="48" y="48" width="504" height="704" rx="28" fill="#ead7be"/>
      <text x="50%" y="46%" text-anchor="middle" fill="#5f4b3e" font-family="Georgia, serif" font-size="34">
        SUNBOUND BOHEME
      </text>
      <text x="50%" y="52%" text-anchor="middle" fill="#7a6556" font-family="Georgia, serif" font-size="20">
        Image coming soon
      </text>
    </svg>
  `)

// Neutral placeholder for the Smells Like Em brand (no Sunbound wording).
export const FRAGRANCE_FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450">
      <rect width="600" height="450" fill="#e9e2cd"/>
      <rect x="250" y="150" width="100" height="170" rx="14" fill="#7c8a4c"/>
      <rect x="278" y="120" width="44" height="34" rx="6" fill="#3c4826"/>
      <text x="50%" y="380" text-anchor="middle" fill="#3c4826" font-family="Georgia, serif" font-size="26">
        Smells Like Em
      </text>
    </svg>
  `)

// Original bottle illustrations (see client/scripts/generate-fragrance-art.mjs).
// They replace the uploaded fragrance photos everywhere on Smells Like Em.
const fragranceArtSlugs = new Set(fragranceArt)

function fragranceSlug(product) {
  if (product?.slug) {
    return product.slug
  }
  return `${product?.brand || ''}-${product?.name || ''}`
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getFragranceArt(product) {
  const slug = fragranceSlug(product)
  return fragranceArtSlugs.has(slug) ? `/fragrance-art/${slug}.svg` : ''
}

export function getFragranceImage(product) {
  return getFragranceArt(product) || product?.imageUrl || FRAGRANCE_FALLBACK_IMAGE
}

export function getProductPath(product) {
  const identifier = product.slug || product.id
  // Fragrances live under the Smells Like Em brand and keep its chrome.
  if (isFragranceProduct(product)) {
    return `/fragrances/${identifier}`
  }
  return `/product/${identifier}`
}

function hasFragranceMetadata(product) {
  return Boolean(
    product?.brand ||
    product?.fragranceType ||
    product?.authenticityNote ||
    product?.occasion
  )
}

// A product counts as a fragrance only when it carries fragrance-specific
// metadata. This avoids routing future size-based apparel variants into the
// fragrance storefront.
export function isFragranceProduct(product) {
  return hasFragranceMetadata(product)
}
