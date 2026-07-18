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

export function getProductPath(product) {
  const identifier = product.slug || product.id
  // Fragrances live under the Smells Like Em brand and keep its chrome.
  if (isFragranceProduct(product)) {
    return `/fragrances/${identifier}`
  }
  return `/product/${identifier}`
}

// A product counts as a fragrance if it was set up with fragrance details
// (brand/type) or sold by size (variants).
export function isFragranceProduct(product) {
  return (
    Boolean(product.fragranceType || product.brand) ||
    (Array.isArray(product.variants) && product.variants.length > 0)
  )
}
