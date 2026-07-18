import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const prisma = new PrismaClient()
const imageManifestPath = resolve(process.cwd(), 'scripts', 'fragrance-image-manifest.json')
const fragranceImageManifest = existsSync(imageManifestPath)
  ? JSON.parse(readFileSync(imageManifestPath, 'utf8'))
  : {}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function mlFromBottleSize(sizeLabel) {
  const normalized = String(sizeLabel || '').toLowerCase().trim()

  if (normalized.includes('6.7')) return 200
  if (normalized.includes('3.6')) return 105
  if (normalized.includes('3.4')) return 100
  if (normalized.includes('100ml')) return 100
  if (normalized.includes('105ml')) return 105
  if (normalized.includes('200ml')) return 200

  return 100
}

function allocateVariantStock(availableMl) {
  const safeMl = Math.max(0, Math.floor(availableMl - 8))
  const twoMlQty = Math.max(2, Math.floor((safeMl * 0.35) / 2))
  const fiveMlQty = Math.max(1, Math.floor((safeMl * 0.25) / 5))
  const tenMlQty = Math.max(1, Math.floor((safeMl * 0.4) / 10))

  return [
    { label: '2ml', price: 0, quantity: twoMlQty, sortOrder: 0 },
    { label: '5ml', price: 0, quantity: fiveMlQty, sortOrder: 1 },
    { label: '10ml', price: 0, quantity: tenMlQty, sortOrder: 2 },
  ]
}

const fragrances = [
  {
    name: 'Maahir Legacy',
    brand: 'Lattafa',
    bottleSize: '3.4 oz',
    fillPercent: 98,
    category: 'Fragrances',
    occasion: 'Value / dupes',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 3, '5ml': 7, '10ml': 15 },
    rating: '8.6/10',
    description:
      '8.6/10. A Sedley-style freshie with less Sprite sparkle and more grown, musky smoothness. Still addictive to wear, still easy to like, and a strong pickup if you want that DNA without spending niche money.',
  },
  {
    name: "Supremacy Collector's Edition",
    brand: 'Afnan',
    bottleSize: '3.4 oz',
    fillPercent: 50,
    category: 'Fragrances',
    occasion: 'Daily driver',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 4, '5ml': 8, '10ml': 16 },
    rating: '9.8/10',
    description:
      '9.8/10. Aventus Absolu energy with loud pineapple, woods, and ridiculous staying power. This is the one you can spray anywhere, oversell to nobody, and still trust to keep projecting long after the day starts.',
  },
  {
    name: 'Mango Ice',
    brand: 'Gulf Orchid',
    bottleSize: '3.4 oz',
    fillPercent: 90,
    category: 'Fragrances',
    occasion: 'Summer scents',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 3, '5ml': 8, '10ml': 15 },
    rating: '9.4/10',
    description:
      '9.4/10. A God of Fire-style mango bomb that turns the fruit all the way up and skips the darker oud edge. Bright, fizzy, almost carbonated, and built to be a summer crowd pleaser.',
  },
  {
    name: 'Odyssey Mega',
    brand: 'Armaf',
    bottleSize: '6.7 oz',
    fillPercent: 98,
    category: 'Fragrances',
    occasion: 'Daily driver',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 3, '5ml': 7, '10ml': 15 },
    rating: '9.1/10',
    description:
      '9.1/10. A bright Y-style fresh scent with cleaner edges and better staying power than you would expect for the price. Super inviting, super easy to overspray, and hard to imagine offending anyone with it.',
  },
  {
    name: 'Club De Nuit Intense Man',
    brand: 'Armaf',
    bottleSize: '6.7 oz',
    fillPercent: 50,
    category: 'Fragrances',
    occasion: 'Value / dupes',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 3, '5ml': 8, '10ml': 15 },
    rating: '9.0/10',
    description:
      '9.0/10. The classic Aventus-style value monster: smoky fruit, versatile wear, and way too good for what it costs. If someone wants a safe blind-grab dupe that still gets attention, this is one of the easy answers.',
  },
  {
    name: 'DXB',
    brand: 'Maison Asrar',
    bottleSize: '3.4 oz',
    fillPercent: 99,
    category: 'Fragrances',
    occasion: 'Summer scents',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 4, '5ml': 8, '10ml': 16 },
    rating: '9.7/10',
    description:
      '9.7/10. Afternoon Swim-style citrus done like a bottle of cold orange soda by the pool. Pure orange, breezy air, vacation energy, and one of the strongest summer reaches in this whole batch.',
  },
  {
    name: 'Coach Blue',
    brand: 'Coach',
    bottleSize: '3.4 oz',
    fillPercent: 99,
    category: 'Fragrances',
    occasion: 'Daily driver',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 3, '5ml': 7, '10ml': 15 },
    rating: '7.0/10',
    description:
      '7.0/10. I am picky with blue scents, but this is one of the smoother mainstream takes on that DNA. Clean, polished, easy to wear, and a nice designer option if you want something fresh without overthinking it.',
  },
  {
    name: 'Coach Green',
    brand: 'Coach',
    bottleSize: '3.4 oz',
    fillPercent: 90,
    category: 'Fragrances',
    occasion: 'Daily driver',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 4, '5ml': 8, '10ml': 16 },
    rating: '9.8/10',
    description:
      '9.8/10. The kiwi note makes this one feel like a real deep cut instead of another copy-paste designer freshie. Underrated, super wearable, and the kind of scent that catches fragrance people off guard in the best way.',
  },
  {
    name: 'Marwa',
    brand: 'Arabiat Prestige',
    bottleSize: '3.4 oz',
    fillPercent: 98,
    category: 'Fragrances',
    occasion: 'Daily driver',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 3, '5ml': 7, '10ml': 15 },
    rating: '8.2/10',
    description:
      '8.2/10. Imagination-style freshness with the tea turned way up front. It is not my personal favorite because the tea can hit hard, but it pulls compliments constantly and lands as an easy, inoffensive reach for most people.',
  },
  {
    name: 'Aristo',
    brand: 'Arabiyat Prestige',
    bottleSize: '3.4 oz',
    fillPercent: 98,
    category: 'Fragrances',
    occasion: 'Value / dupes',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 4, '5ml': 8, '10ml': 16 },
    rating: '8.5/10',
    description:
      '8.5/10. An Ingenious Ginger-style scent with bright citrus, sparkling ginger, and a smooth sweet warmth underneath. A pretty good fresh reach that feels lively, easy to wear, and gives you that expensive ginger DNA for much less.',
  },
  {
    name: 'Aether Extrait',
    brand: 'French Avenue',
    bottleSize: '3.4 oz',
    fillPercent: 40,
    category: 'Fragrances',
    occasion: 'Value / dupes',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 4, '5ml': 8, '10ml': 16 },
    rating: '10/10',
    description:
      '10/10. A Greenley-style fresh green apple scent done so well it lowkey challenges the original. Crisp, addictive, and one of the strongest value buys in this whole collection if you like bright green designer-niche crossover DNA.',
  },
  {
    name: 'Ocean Noir',
    brand: 'Michael Malul',
    bottleSize: '3.4 oz',
    fillPercent: 50,
    category: 'Fragrances',
    occasion: 'Summer scents',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 6, '5ml': 12, '10ml': 20 },
    rating: '8.8/10',
    description:
      '8.8/10. A smooth marine niche scent that smells like clean beach air, salt, and ocean breeze instead of cheap aquatic body wash. Beautiful smell, beautiful memory piece, just know the performance is more relaxed than the scent quality.',
  },
  {
    name: 'Rayhaan Aquatica',
    brand: 'Rayhaan',
    bottleSize: '3.4 oz',
    fillPercent: 95,
    category: 'Fragrances',
    occasion: 'Summer scents',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 3, '5ml': 8, '10ml': 15 },
    rating: '9.2/10',
    description:
      '9.2/10. Coconut mojito energy in the best way: creamy, tropical, airy, and built for heat. I have not smelled Virgin Island Water side by side, but as a summer scent on its own this is ridiculously fun to wear.',
  },
  {
    name: 'The Most Wanted',
    brand: 'Azzaro',
    bottleSize: '3.4 oz',
    fillPercent: 80,
    category: 'Fragrances',
    occasion: 'Date night',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 4, '5ml': 8, '10ml': 16 },
    rating: '9.3/10',
    description:
      '9.3/10. One of the easiest designer date-night reaches around. Rich, sexy, and room-filling, but still smooth enough that it never feels like it is drowning you out.',
  },
  {
    name: 'Kaaf',
    brand: 'Khadlaj',
    bottleSize: '3.4 oz',
    fillPercent: 95,
    category: 'Fragrances',
    occasion: 'Daily driver',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 3, '5ml': 6, '10ml': 14 },
    rating: '6.2/10',
    description:
      '6.2/10. Super clean and sharp, almost to the point of giving off a cleaning-supply vibe. If you like that ultra-fresh DNA it may land better for you than it does for me, but this is one I would sample before going bigger.',
  },
  {
    name: 'Liquid Brun',
    brand: 'French Avenue',
    bottleSize: '3.4 oz',
    fillPercent: 80,
    category: 'Fragrances',
    occasion: 'Date night',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 4, '5ml': 8, '10ml': 16 },
    rating: '9.8/10',
    description:
      '9.8/10. An Altair-style sweet-spiced amber scent done almost perfectly for the price. Rich, smooth, and absolutely worth grabbing if that Parfums de Marly style is your lane.',
  },
  {
    name: 'CK One',
    brand: 'Calvin Klein',
    bottleSize: '3.4 oz',
    fillPercent: 95,
    category: 'Fragrances',
    occasion: 'Daily driver',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 3, '5ml': 6, '10ml': 13 },
    rating: '5.8/10',
    description:
      '5.8/10. Clean linen, fresh out of the shower, and easy to wear, but not a big performer or standout. More of a simple casual freshie than a scent I would reach for when I want to impress anybody.',
  },
  {
    name: 'Shiyaaka Snow',
    brand: 'Khadlaj',
    bottleSize: '3.4 oz',
    fillPercent: 95,
    category: 'Fragrances',
    occasion: 'Daily driver',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 3, '5ml': 7, '10ml': 15 },
    rating: '7.9/10',
    description:
      '7.9/10. A clean citrus-vetiver freshie in the Louis Vuitton Meteore lane. Not my favorite personal wear, but people clearly respond to it and it lands as an easy, polished daytime scent.',
  },
  {
    name: 'Burberry Touch for Men',
    brand: 'Burberry',
    bottleSize: '3.4 oz',
    fillPercent: 95,
    category: 'Fragrances',
    occasion: 'Daily driver',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 3, '5ml': 7, '10ml': 15 },
    rating: '7.1/10',
    description:
      '7.1/10. Soft, wearable, and easy to live with, but definitely more generic than unforgettable. Still a solid everyday grab, especially if you want something easygoing and not too loud.',
  },
  {
    name: 'Musamam Black Intense',
    brand: 'Lattafa',
    bottleSize: '3.4 oz',
    fillPercent: 95,
    category: 'Fragrances',
    occasion: 'Date night',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 3, '5ml': 7, '10ml': 15 },
    rating: '7.8/10',
    description:
      '7.8/10. Warm, spicy, and easy to wear through most of the year without getting too loud. It may push harder in serious heat, but overall it is a solid spicy reach even if it is not one of my personal top favorites.',
  },
  {
    name: 'Rayhaan Elixir',
    brand: 'Rayhaan',
    bottleSize: '3.4 oz',
    fillPercent: 95,
    category: 'Fragrances',
    occasion: 'Date night',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 4, '5ml': 8, '10ml': 16 },
    rating: '9.1/10',
    description:
      '9.1/10. Ultra Male-style sweetness with a smooth honey edge and none of the overwhelming heaviness people sometimes expect from this DNA. Easy to love, easy to wear, and one of the more sentimental bottles in the collection too.',
  },
  {
    name: 'Rayhaan Obsidian',
    brand: 'Rayhaan',
    bottleSize: '3.4 oz',
    fillPercent: 95,
    category: 'Fragrances',
    occasion: 'Date night',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 4, '5ml': 8, '10ml': 16 },
    rating: '8.9/10',
    description:
      '8.9/10. A dark Dior Homme Parfum-style date-night scent with iris, sweetness, and a dressed-up evening feel. It is the kind of fragrance that feels confident and polished without needing a ton of sprays.',
  },
  {
    name: 'Rayhaan Tera',
    brand: 'Rayhaan',
    bottleSize: '3.4 oz',
    fillPercent: 99,
    category: 'Fragrances',
    occasion: 'Winter scents',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 3, '5ml': 7, '10ml': 15 },
    rating: '7.3/10',
    description:
      '7.3/10. Peppery, resinous, and a little more serious than the average easy freshie. I have not worn it enough to fully trust it in heat, so this is one I would lean toward cooler days until it proves itself more.',
  },
  {
    name: 'Asad Elixir',
    brand: 'Lattafa',
    bottleSize: '3.4 oz',
    fillPercent: 99,
    category: 'Fragrances',
    occasion: 'Date night',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 3, '5ml': 7, '10ml': 15 },
    rating: '6.9/10',
    description:
      '6.9/10. Not a bad scent at all, just not something that feels especially made for my taste. If you already like this darker sweet-spicy lane, it may hit better for you than it does for me.',
  },
  {
    name: 'Turathi Blue',
    brand: 'Afnan',
    bottleSize: '3.4 oz',
    fillPercent: 80,
    category: 'Fragrances',
    occasion: 'Summer scents',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 4, '5ml': 8, '10ml': 16 },
    rating: '9.0/10',
    description:
      '9.0/10. Tygar-style grapefruit freshness with a slightly sharp opening that can lean bug-spray for a second before settling into something seriously addictive. Bright, modern, and one I genuinely like a lot.',
  },
  {
    name: 'Turathi Electric',
    brand: 'Afnan',
    bottleSize: '3.4 oz',
    fillPercent: 95,
    category: 'Fragrances',
    occasion: 'Summer scents',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 3, '5ml': 8, '10ml': 15 },
    rating: '8.2/10',
    description:
      '8.2/10. A light Blue Talisman-style scent with airy bubblegum sweetness and a softer, slightly more feminine lean. It is easy to imagine this working really well in summer if you like fresher sweet scents that stay playful.',
  },
  {
    name: 'Rayhaan Pacific',
    brand: 'Rayhaan',
    bottleSize: '3.4 oz',
    fillPercent: 90,
    category: 'Fragrances',
    occasion: 'Summer scents',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 3, '5ml': 7, '10ml': 15 },
    rating: '7.7/10',
    description:
      '7.7/10. Bright, minty, and sharp in a way that definitely fits the Pacific Chill lane. I like it, my dad really likes it, but the extra minty brightness keeps me from reaching for it as often as some of the others.',
  },
  {
    name: 'Bleu de Chanel',
    brand: 'Chanel',
    bottleSize: '3.4 oz',
    fillPercent: 50,
    category: 'Fragrances',
    occasion: 'Daily driver',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 5, '5ml': 10, '10ml': 18 },
    rating: '9.5/10',
    description:
      '9.5/10. One of the easiest everyday designer wins ever made. Office-safe, clean, versatile, and polished in a way that almost never misses, which is why people keep going back to it for work and daily wear.',
  },
  {
    name: 'Yacht Club',
    brand: 'Gulf Orchid',
    bottleSize: '3.4 oz',
    fillPercent: 90,
    category: 'Fragrances',
    occasion: 'Date night',
    fragranceType: 'Decant',
    authenticityNote: 'Personal bottle decants, filled by hand from my own collection.',
    prices: { '2ml': 3, '5ml': 6, '10ml': 14 },
    rating: '6.4/10',
    description:
      '6.4/10. A 40 Knots-style leathery marine scent that clearly works better for some people around me than it does for me personally. If you like mature, slightly leathery ocean scents it may be more your lane than mine.',
  },
]

const fragranceNotesBySlug = {
  'lattafa-maahir-legacy': { sourceType: 'official / community cross-check', top: ['Lime', 'Grapefruit', 'Lavender', 'Spearmint', 'Pineapple'], heart: ['Juniper Berry', 'Rosemary', 'Olibanum', 'Geranium', 'Black Pepper'], base: ['Vetiver', 'Cashmeran', 'Ambrox', 'Oakmoss', 'Tonka Bean'] },
  'afnan-supremacy-collector-s-edition': { sourceType: 'official', top: ['Pineapple', 'Bergamot', 'Apple', 'White Florals'], heart: ['Orange Blossom', 'Birch', 'Amber'], base: ['Oakmoss', 'Musk', 'Ambergris'] },
  'gulf-orchid-mango-ice': { sourceType: 'community / retailer', top: ['Mango', 'Lemon', 'Ginger', 'Rhubarb'], heart: ['White Florals', 'Amber', 'Licorice'], base: ['Musk', 'Vanilla', 'Caramel', 'Chestnut'] },
  'armaf-odyssey-mega': { sourceType: 'community', top: ['Lemon', 'Bergamot', 'Ginger', 'Orange', 'Mint'], heart: ['Geranium', 'Juniper', 'Pineapple', 'Sage', 'Berries'], base: ['Cedar', 'Musk', 'Tonka Bean', 'Vetiver'] },
  'armaf-club-de-nuit-intense-man': { sourceType: 'community / database', top: ['Lemon', 'Pineapple', 'Bergamot', 'Blackcurrant', 'Apple'], heart: ['Birch', 'Jasmine', 'Rose'], base: ['Musk', 'Ambergris', 'Patchouli', 'Vanilla'] },
  'maison-asrar-dxb': { sourceType: 'official', top: ['Orange', 'Mandarin', 'Bergamot'], heart: ['Grapefruit', 'Ginger'], base: ['Lily of the Valley', 'Musk'] },
  'coach-coach-blue': { sourceType: 'official', top: ['Lime', 'Absinthe'], heart: ['Ozonic Accord', 'Black Pepper'], base: ['Cedarwood', 'Amber'] },
  'coach-coach-green': { sourceType: 'official', top: ['Kiwi', 'Bergamot'], heart: ['Rosemary', 'Geranium'], base: ['Crystal Moss', 'Cedarwood'] },
  'arabiat-prestige-marwa': { sourceType: 'community / retailer', top: ['Calabrian Bergamot', 'Lemon', 'Sicilian Orange'], heart: ['Nigerian Ginger', 'Ceylon Cinnamon', 'Tunisian Neroli'], base: ['Ambroxan', 'Chinese Black Tea', 'Olibanum', 'Guaiac Wood'] },
  'arabiyat-prestige-aristo': { sourceType: 'reported scent profile', top: ['Ginger', 'Citrus', 'Bergamot'], heart: ['Soft Florals', 'Aromatic Fresh Notes'], base: ['Vanilla', 'Sandalwood', 'Musk'] },
  'french-avenue-aether-extrait': { sourceType: 'official / community cross-check', top: ['Green Apple', 'Bergamot', 'Mandarin Orange'], heart: ['Petitgrain', 'Cashmeran', 'Cedar', 'Violet'], base: ['Oakmoss', 'Musk', 'Amberwood'] },
  'michael-malul-ocean-noir': { sourceType: 'official', top: ['Marine Mist', 'Tangelo', 'Black Coconut'], heart: ['Sea Kelp', 'Yarrow', 'Geranium'], base: ['Amberwood', 'Tonka Bean', 'Musk'] },
  'rayhaan-rayhaan-aquatica': { sourceType: 'official', top: ['Coconut', 'Lime', 'Bergamot', 'Mandarin'], heart: ['Ginger', 'Ylang-Ylang', 'Jasmine', 'Hibiscus'], base: ['White Rum', 'Sugar Cane', 'Musk'] },
  'azzaro-the-most-wanted': { sourceType: 'official / retailer', top: ['Cardamom'], heart: ['Toffee Accord'], base: ['Amberwood'] },
  'khadlaj-kaaf': { sourceType: 'reported scent profile', top: ['Citrus', 'Watermelon', 'Red Fruits'], heart: ['Lavender', 'Jasmine', 'Lotus'], base: ['Sandalwood', 'Musk', 'Amber'] },
  'french-avenue-liquid-brun': { sourceType: 'community / database', top: ['Cinnamon', 'Orange Blossom', 'Cardamom', 'Bergamot'], heart: ['Bourbon Vanilla', 'Elemi Resin'], base: ['Praline', 'Ambroxan', 'Guaiac Wood', 'Musk'] },
  'calvin-klein-ck-one': { sourceType: 'official / community cross-check', top: ['Bergamot', 'Cardamom', 'Pineapple', 'Papaya', 'Lemon', 'Mandarin'], heart: ['Jasmine', 'Violet', 'Rose', 'Nutmeg', 'Lily of the Valley'], base: ['Green Tea', 'Musk', 'Amber', 'Cedar', 'Sandalwood', 'Oakmoss'] },
  'khadlaj-shiyaaka-snow': { sourceType: 'reported scent profile', top: ['Mandarin', 'Bergamot', 'Citrus'], heart: ['Neroli', 'Pink Pepper', 'Nutmeg'], base: ['Vetiver', 'Cardamom', 'Clean Musk'] },
  'burberry-burberry-touch-for-men': { sourceType: 'official', top: ['Violet Leaf', 'Artemisia', 'Mandarin Orange'], heart: ['White Pepper', 'Cedar', 'Nutmeg'], base: ['White Musk', 'Tonka Bean', 'Vetiver'] },
  'lattafa-musamam-black-intense': { sourceType: 'official', top: ['Lavender', 'Nutmeg', 'Bergamot', 'Sage'], heart: ['Geranium', 'Rosyfolia', 'Mahonial', 'Cedarwood'], base: ['Maple Wood', 'Patchouli', 'Tonka Bean', 'Cocoapulse', 'Ambrofix'] },
  'rayhaan-rayhaan-elixir': { sourceType: 'reported scent profile', top: ['Mint', 'Lavender', 'Bergamot'], heart: ['Honey', 'Benzoin', 'Cinnamon'], base: ['Vanilla', 'Tonka Bean', 'Tobacco'] },
  'rayhaan-rayhaan-obsidian': { sourceType: 'community / database', top: ['Iris', 'Citrus'], heart: ['Leather'], base: ['Sandalwood', 'Ambrette', 'Cedar', 'Oud'] },
  'rayhaan-rayhaan-tera': { sourceType: 'official / community cross-check', top: ['Frankincense', 'Cardamom', 'Elemi', 'Lemon', 'Bergamot', 'Sichuan Pepper'], heart: ['Patchouli', 'Anise', 'Coriander', 'Wormwood', 'Cumin', 'Orange Blossom', 'Saffron', 'Geranium', 'Rose'], base: ['Frankincense', 'Vanilla', 'Benzoin', 'Amber', 'Oud', 'Opoponax', 'Birch', 'Ambergris', 'Maltol', 'Labdanum', 'Musk'] },
  'lattafa-asad-elixir': { sourceType: 'official', top: ['Pink Pepper', 'Saffron', 'Grapefruit'], heart: ['Tobacco', 'Cedarwood', 'Vanilla'], base: ['Patchouli', 'Olibanum', 'Cashmeran', 'Dry Amber'] },
  'afnan-turathi-blue': { sourceType: 'official', top: ['Bergamot', 'Mandarin'], heart: ['Amber', 'Woody Notes'], base: ['Musk', 'Patchouli', 'Fresh Spices'] },
  'afnan-turathi-electric': { sourceType: 'community / launch note list', top: ['Pear', 'Mandarin', 'Pink Grapefruit', 'Bergamot'], heart: ['Orange Blossom', 'Apple', 'Cedar'], base: ['Musk', 'Amber', 'Vanilla'] },
  'rayhaan-rayhaan-pacific': { sourceType: 'reported scent profile', top: ['Mint', 'Citron', 'Orange'], heart: ['Blackcurrant', 'Apricot', 'Basil'], base: ['Ambrette', 'Fig', 'Dates'] },
  'chanel-bleu-de-chanel': { sourceType: 'official / community cross-check', top: ['Grapefruit', 'Lemon', 'Mint', 'Bergamot', 'Pink Pepper'], heart: ['Ginger', 'Jasmine', 'Nutmeg', 'Melon'], base: ['Incense', 'Amber', 'Cedar', 'Sandalwood', 'Patchouli', 'Labdanum'] },
  'gulf-orchid-yacht-club': { sourceType: 'reported scent profile', top: ['Sea Salt', 'Green Notes'], heart: ['Sea Water', 'Woody Notes', 'Cashmeran'], base: ['Cedar', 'Amber', 'Soft Leather'] },
}

async function upsertFragrance(entry) {
  const bottleMl = mlFromBottleSize(entry.bottleSize)
  const availableMl = bottleMl * (entry.fillPercent / 100)
  const variants = allocateVariantStock(availableMl).map((variant) => ({
    ...variant,
    price: entry.prices[variant.label],
  }))
  const slug = slugify(`${entry.brand}-${entry.name}`)
  const imageUrl = fragranceImageManifest[slug] || ''
  const fragranceNotes = fragranceNotesBySlug[slug]
    ? JSON.stringify(fragranceNotesBySlug[slug])
    : null

  const existing = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  })

  if (existing) {
    await prisma.productVariant.deleteMany({
      where: { productId: existing.id },
    })

    return prisma.product.update({
      where: { id: existing.id },
      data: {
        name: entry.name,
        slug,
        price: entry.prices['2ml'],
        description: entry.description,
        imageUrl,
        galleryImages: '[]',
        category: entry.category,
        size: null,
        quantity: variants.reduce((sum, variant) => sum + variant.quantity, 0),
        shippingProfile: 'standard',
        shippingCustomAmount: null,
        brand: entry.brand,
        fragranceType: entry.fragranceType,
        authenticityNote: entry.authenticityNote,
        occasion: entry.occasion,
        fragranceNotes,
        variants: {
          create: variants,
        },
      },
    })
  }

  return prisma.product.create({
    data: {
      name: entry.name,
      slug,
      price: entry.prices['2ml'],
      description: entry.description,
      imageUrl,
      galleryImages: '[]',
      category: entry.category,
      size: null,
      quantity: variants.reduce((sum, variant) => sum + variant.quantity, 0),
      shippingProfile: 'standard',
      shippingCustomAmount: null,
      brand: entry.brand,
      fragranceType: entry.fragranceType,
      authenticityNote: entry.authenticityNote,
      occasion: entry.occasion,
      fragranceNotes,
      variants: {
        create: variants,
      },
    },
  })
}

async function main() {
  for (const fragrance of fragrances) {
    const saved = await upsertFragrance(fragrance)
    console.log(`Saved ${saved.brand} ${saved.name}`)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
