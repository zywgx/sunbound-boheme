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

export function getProductPath(product) {
  return `/product/${product.slug || product.id}`
}
