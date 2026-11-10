// Generates the original bottle illustrations used by the Smells Like Em
// fragrance pages. Every image is drawn from scratch here (no product photos),
// so there are no copyright concerns, and SVG stays sharp at any screen size.
//
// Run from the client folder:  node scripts/generate-fragrance-art.mjs
// Output: public/fragrance-art/<product-slug>.svg and src/data/fragrance-art.json
//
// To add a new scent, add an entry to `bottles` keyed by the product slug
// (slugified "brand-name", same as server/scripts/import-fragrance-batch.js).

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const W = 600
const H = 750
const CX = W / 2
const FLOOR = 640
const SERIF = "Georgia, 'Times New Roman', serif"

let uid = 0
const id = (prefix) => `${prefix}${++uid}`

const esc = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// ---------- paint helpers ----------

function linear(stops, { x2 = 1, y2 = 0 } = {}) {
  const gid = id('g')
  const body = stops
    .map(([offset, color, opacity = 1]) =>
      `<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}"/>`)
    .join('')
  return { id: gid, def: `<linearGradient id="${gid}" x1="0" y1="0" x2="${x2}" y2="${y2}">${body}</linearGradient>`, url: `url(#${gid})` }
}

// Horizontal glass/metal shading: dark edges, bright left-of-centre.
function sheen(base, light, dark) {
  return linear([
    [0, dark],
    [0.18, base],
    [0.34, light],
    [0.55, base],
    [0.86, base],
    [1, dark],
  ])
}

function metal(tone) {
  const tones = {
    gold: ['#c9a24a', '#f6e3a6', '#8a6a24'],
    rose: ['#c99a86', '#f5dccf', '#8c5e4c'],
    silver: ['#b9bcc2', '#f4f5f7', '#6f737a'],
    gunmetal: ['#55585e', '#9a9ea6', '#2a2c30'],
    black: ['#1d1d20', '#4a4a50', '#08080a'],
    brown: ['#6b4430', '#a87a5c', '#3a2418'],
    white: ['#ece8df', '#ffffff', '#c9c3b6'],
    navy: ['#1a2440', '#3a4a78', '#0b1122'],
  }
  const [base, light, dark] = tones[tone] || tones.silver
  return { ...sheen(base, light, dark), base, light, dark }
}

// ---------- scene ----------

function scene({ accent, defs, art }) {
  const bg = id('bg')
  const sh = id('sh')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="45 110 510 638" width="510" height="638">
<defs>
<radialGradient id="${bg}" cx="50%" cy="38%" r="75%">
<stop offset="0" stop-color="#fffaf0"/>
<stop offset="0.55" stop-color="${accent}" stop-opacity="0.22"/>
<stop offset="1" stop-color="#7c8a4c" stop-opacity="0.28"/>
</radialGradient>
<radialGradient id="${sh}" cx="50%" cy="50%" r="50%">
<stop offset="0" stop-color="#2a3119" stop-opacity="0.32"/>
<stop offset="1" stop-color="#2a3119" stop-opacity="0"/>
</radialGradient>
${defs.join('\n')}
</defs>
<rect width="${W}" height="${H}" fill="#f4ead6"/>
<rect width="${W}" height="${H}" fill="url(#${bg})"/>
<ellipse cx="${CX}" cy="${FLOOR + 6}" rx="190" ry="22" fill="url(#${sh})"/>
${art}
</svg>
`
}

// Glass highlight streak on the left of a body.
function streak(x, y, w, h, opacity = 0.35) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}" fill="#ffffff" opacity="${opacity}"/>`
}

function text(value, x, y, { size = 22, color = '#ffffff', weight = 400, spacing = 2, family = SERIF, anchor = 'middle', opacity = 1 } = {}) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${family}" font-size="${size}" font-weight="${weight}" letter-spacing="${spacing}" fill="${color}" opacity="${opacity}">${esc(value)}</text>`
}

// Fit a label to a max width by shrinking the font a little for long names.
function fitSize(value, base, maxChars) {
  return value.length > maxChars ? Math.max(12, Math.round((base * maxChars) / value.length)) : base
}

function lattice(color, size = 34, stroke = 3) {
  const pid = id('p')
  const s = size
  const h = s / 2
  return {
    def: `<pattern id="${pid}" width="${s}" height="${s}" patternUnits="userSpaceOnUse"><path d="M${h} 0 L${s} ${h} L${h} ${s} L0 ${h} Z M0 0 L${s} ${s} M${s} 0 L0 ${s} M${h} 0 V${s} M0 ${h} H${s}" fill="none" stroke="${color}" stroke-width="${stroke}"/><circle cx="${h}" cy="${h}" r="${s / 6}" fill="none" stroke="${color}" stroke-width="${stroke * 0.8}"/></pattern>`,
    url: `url(#${pid})`,
  }
}

function speckle(color) {
  const pid = id('p')
  return {
    def: `<pattern id="${pid}" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="5" cy="7" r="1.6" fill="${color}"/><circle cx="22" cy="3" r="1.1" fill="${color}"/><circle cx="31" cy="18" r="1.8" fill="${color}"/><circle cx="12" cy="24" r="1.2" fill="${color}"/><circle cx="26" cy="33" r="1.4" fill="${color}"/><circle cx="37" cy="36" r="0.9" fill="${color}"/><circle cx="3" cy="35" r="1.3" fill="${color}"/></pattern>`,
    url: `url(#${pid})`,
  }
}

function texture(color) {
  const pid = id('p')
  return {
    def: `<pattern id="${pid}" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.4" fill="${color}"/><circle cx="9" cy="9" r="1.4" fill="${color}"/></pattern>`,
    url: `url(#${pid})`,
  }
}

function medallion(x, y, r, tone) {
  const m = metal(tone)
  let rays = ''
  for (let i = 0; i < 24; i += 1) {
    const a = (i / 24) * Math.PI * 2
    rays += `<line x1="${x + Math.cos(a) * r * 0.35}" y1="${y + Math.sin(a) * r * 0.35}" x2="${x + Math.cos(a) * r * 0.78}" y2="${y + Math.sin(a) * r * 0.78}" stroke="${m.dark}" stroke-width="1.6"/>`
  }
  return {
    defs: [m.def],
    svg: `<circle cx="${x}" cy="${y}" r="${r}" fill="${m.url}"/><circle cx="${x}" cy="${y}" r="${r * 0.86}" fill="none" stroke="${m.dark}" stroke-width="2"/>${rays}<circle cx="${x}" cy="${y}" r="${r * 0.2}" fill="${m.dark}"/>`,
  }
}

// Ornate crown-style cap (Gulf Orchid bottles).
function crownCap(top, tone) {
  const m = metal(tone)
  const y = top
  const svg = `
<rect x="${CX - 26}" y="${y + 92}" width="52" height="20" rx="4" fill="${m.url}"/>
<path d="M${CX - 46} ${y + 92} C ${CX - 58} ${y + 50}, ${CX - 40} ${y + 18}, ${CX - 22} ${y + 30} C ${CX - 18} ${y + 6}, ${CX + 18} ${y + 6}, ${CX + 22} ${y + 30} C ${CX + 40} ${y + 18}, ${CX + 58} ${y + 50}, ${CX + 46} ${y + 92} Z" fill="${m.url}"/>
<path d="M${CX - 22} ${y + 30} C ${CX - 14} ${y + 52}, ${CX - 10} ${y + 70}, ${CX - 12} ${y + 92} M${CX + 22} ${y + 30} C ${CX + 14} ${y + 52}, ${CX + 10} ${y + 70}, ${CX + 12} ${y + 92} M${CX} ${y + 14} V ${y + 92}" stroke="${m.dark}" stroke-width="2.4" fill="none" opacity="0.7"/>
<circle cx="${CX}" cy="${y + 10}" r="8" fill="${m.url}"/>`
  return { defs: [m.def], svg }
}

// ---------- bottle builders ----------

// Classic rectangular bottle with a block cap.
function rectBottle({
  w = 250, h = 300, rx = 18, glass, juice, juiceLevel = 1, capTone = 'black', capW = 90, capH = 80, capRx = 6,
  neckTone = 'silver', label, labelColor = '#ffffff', sub, accent = '#7c8a4c', capShape = 'block', extra = '',
}) {
  const top = FLOOR - h
  const x = CX - w / 2
  const g = sheen(...glass)
  const cap = metal(capTone)
  const neck = metal(neckTone)
  const defs = [g.def, cap.def, neck.def]
  const clip = id('c')
  defs.push(`<clipPath id="${clip}"><rect x="${x}" y="${top}" width="${w}" height="${h}" rx="${rx}"/></clipPath>`)
  let juiceSvg = ''
  if (juice) {
    const jg = sheen(...juice)
    defs.push(jg.def)
    const jh = (h - 30) * juiceLevel
    juiceSvg = `<rect x="${x + 14}" y="${FLOOR - 16 - jh}" width="${w - 28}" height="${jh}" rx="${Math.max(4, rx - 8)}" fill="${jg.url}" opacity="0.9"/>`
  }
  const capY = top - 18 - capH
  let capSvg
  if (capShape === 'cylinder') {
    capSvg = `<rect x="${CX - capW / 2}" y="${capY}" width="${capW}" height="${capH}" rx="${capRx}" fill="${cap.url}"/><ellipse cx="${CX}" cy="${capY + 4}" rx="${capW / 2 - 2}" ry="5" fill="${cap.light}" opacity="0.35"/>`
  } else if (capShape === 'cone') {
    capSvg = `<path d="M${CX - capW / 2} ${capY + capH} L${CX - capW / 2 + 14} ${capY} H${CX + capW / 2 - 14} L${CX + capW / 2} ${capY + capH} Z" fill="${cap.url}"/>`
  } else if (capShape === 'octagon') {
    const c = 14
    capSvg = `<path d="M${CX - capW / 2 + c} ${capY} H${CX + capW / 2 - c} L${CX + capW / 2} ${capY + c} V${capY + capH - c} L${CX + capW / 2 - c} ${capY + capH} H${CX - capW / 2 + c} L${CX - capW / 2} ${capY + capH - c} V${capY + c} Z" fill="${cap.url}"/>`
  } else {
    capSvg = `<rect x="${CX - capW / 2}" y="${capY}" width="${capW}" height="${capH}" rx="${capRx}" fill="${cap.url}"/>`
  }
  const labelSize = label ? fitSize(label, 26, 14) : 0
  const art = `
<rect x="${CX - 22}" y="${top - 20}" width="44" height="24" rx="3" fill="${neck.url}"/>
${capSvg}
<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="${rx}" fill="${g.url}"/>
<g clip-path="url(#${clip})">${juiceSvg}${extra}</g>
${streak(x + 18, top + 18, 12, h - 60)}
<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="${rx}" fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="2"/>
${label ? text(label.toUpperCase(), CX, top + h * 0.56, { size: labelSize, color: labelColor, spacing: 3 }) : ''}
${sub ? text(sub.toUpperCase(), CX, top + h * 0.56 + 28, { size: 13, color: labelColor, spacing: 4, opacity: 0.8 }) : ''}`
  return { accent, defs, art }
}

// Rayhaan-style square bottle with a metal lattice overlay and tall square cap.
function latticeBottle({ glass, tone, label = 'RAYHAAN', sub, accent, capTone }) {
  const w = 270
  const h = 290
  const top = FLOOR - h
  const x = CX - w / 2
  const g = sheen(...glass)
  const m = metal(tone)
  const cap = metal(capTone || tone)
  const lat = lattice(m.base, 34, 3)
  const capLat = lattice(cap.dark, 20, 2)
  const defs = [g.def, m.def, cap.def, lat.def, capLat.def]
  const clip = id('c')
  defs.push(`<clipPath id="${clip}"><rect x="${x}" y="${top}" width="${w}" height="${h}" rx="14"/></clipPath>`)
  const capX = CX - 46
  const capY = top - 128
  return {
    accent,
    defs,
    art: `
<rect x="${CX - 24}" y="${top - 22}" width="48" height="26" fill="${cap.url}"/>
<rect x="${capX}" y="${capY}" width="92" height="108" rx="4" fill="${cap.url}"/>
<rect x="${capX + 8}" y="${capY + 8}" width="76" height="92" fill="${capLat.url}" opacity="0.8"/>
<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="14" fill="${g.url}"/>
<g clip-path="url(#${clip})"><rect x="${x}" y="${top}" width="${w}" height="${h}" fill="${lat.url}" opacity="0.95"/></g>
<rect x="${x + 6}" y="${top + 6}" width="${w - 12}" height="${h - 12}" rx="10" fill="none" stroke="${m.base}" stroke-width="10"/>
${streak(x + 22, top + 22, 10, h - 80, 0.25)}
<rect x="${CX - 96}" y="${top + h * 0.5 - 34}" width="192" height="${sub ? 74 : 48}" rx="4" fill="${m.dark}" opacity="0.92"/>
${text(label, CX, top + h * 0.5 - 2, { size: 24, color: m.light, spacing: 5 })}
${sub ? text(sub.toUpperCase(), CX, top + h * 0.5 + 26, { size: 15, color: m.light, spacing: 5 }) : ''}`,
  }
}

// Curvy amphora (Afnan Turathi line).
function amphora({ glass, juice, capTone, label, accent, labelColor = '#f6e3a6' }) {
  const g = sheen(...glass)
  const cap = metal(capTone)
  const defs = [g.def, cap.def]
  const top = 300
  const body = `M${CX - 60} ${top} C ${CX - 70} ${top + 40}, ${CX - 150} ${top + 60}, ${CX - 150} ${top + 150} C ${CX - 150} ${top + 250}, ${CX - 110} ${FLOOR - 20}, ${CX - 70} ${FLOOR} H ${CX + 70} C ${CX + 110} ${FLOOR - 20}, ${CX + 150} ${top + 250}, ${CX + 150} ${top + 150} C ${CX + 150} ${top + 60}, ${CX + 70} ${top + 40}, ${CX + 60} ${top} Z`
  const clip = id('c')
  defs.push(`<clipPath id="${clip}"><path d="${body}"/></clipPath>`)
  let juiceSvg = ''
  if (juice) {
    const jg = sheen(...juice)
    defs.push(jg.def)
    juiceSvg = `<rect x="${CX - 160}" y="${top + 90}" width="320" height="300" fill="${jg.url}" opacity="0.85"/>`
  }
  const capTop = top - 120
  return {
    accent,
    defs,
    art: `
<rect x="${CX - 20}" y="${top - 22}" width="40" height="26" fill="${cap.url}"/>
<path d="M${CX - 34} ${top - 20} C ${CX - 30} ${capTop + 60}, ${CX - 70} ${capTop + 30}, ${CX - 58} ${capTop + 6} C ${CX - 30} ${capTop + 18}, ${CX - 20} ${capTop}, ${CX} ${capTop} C ${CX + 20} ${capTop}, ${CX + 30} ${capTop + 18}, ${CX + 58} ${capTop + 6} C ${CX + 70} ${capTop + 30}, ${CX + 30} ${capTop + 60}, ${CX + 34} ${top - 20} Z" fill="${cap.url}"/>
<path d="${body}" fill="${g.url}"/>
<g clip-path="url(#${clip})">${juiceSvg}${streak(CX - 120, top + 90, 12, 170, 0.3)}</g>
<path d="${body}" fill="none" stroke="#000" stroke-opacity="0.2" stroke-width="2"/>
${text(label.toUpperCase(), CX, top + 200, { size: 26, color: labelColor, spacing: 4 })}
${text('AFNAN', CX, top + 290, { size: 12, color: labelColor, spacing: 5, opacity: 0.8 })}`,
  }
}

// Rounded short bottle (Coach Blue / Green), with a little chain hint.
function coachBottle({ glass, label, accent }) {
  const g = sheen(...glass)
  const cap = metal('silver')
  const w = 230
  const h = 250
  const top = FLOOR - h
  const x = CX - w / 2
  let chain = ''
  for (let i = 0; i < 8; i += 1) {
    chain += `<ellipse cx="${x + w + 6}" cy="${top + 10 + i * 13}" rx="4" ry="7" fill="none" stroke="${cap.dark}" stroke-width="2.4"/>`
  }
  return {
    accent,
    defs: [g.def, cap.def],
    art: `
<rect x="${CX - 34}" y="${top - 64}" width="68" height="68" rx="10" fill="${cap.url}"/>
<rect x="${CX - 26}" y="${top - 82}" width="52" height="22" rx="6" fill="${cap.url}"/>
<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="60" fill="${g.url}"/>
${streak(x + 22, top + 40, 12, h - 100)}
<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="60" fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="2"/>
${chain}
<path d="M${x + 40} ${top + h * 0.62} q 30 -24 60 0 t 60 0 t 50 0" fill="none" stroke="#ffffff" stroke-opacity="0.6" stroke-width="3"/>
${text('COACH', CX, top + h * 0.45, { size: 28, color: '#ffffff', spacing: 6 })}
${text(label.toUpperCase(), CX, top + h * 0.45 + 26, { size: 14, color: '#ffffff', spacing: 5, opacity: 0.85 })}`,
  }
}

// ---------- the 29 bottles ----------

const bottles = {
  'lattafa-maahir-legacy': () => {
    const body = metal('silver')
    const head = metal('silver')
    const top = 360
    const shape = `M${CX - 80} ${top} H ${CX + 80} C ${CX + 96} ${top + 40}, ${CX + 120} ${top + 70}, ${CX + 120} ${top + 120} V ${FLOOR - 16} Q ${CX + 120} ${FLOOR}, ${CX + 104} ${FLOOR} H ${CX - 104} Q ${CX - 120} ${FLOOR}, ${CX - 120} ${FLOOR - 16} V ${top + 120} C ${CX - 120} ${top + 70}, ${CX - 96} ${top + 40}, ${CX - 80} ${top} Z`
    // Stylised horse-head stopper.
    const hx = CX
    const hy = top - 6
    const horse = `M${hx - 34} ${hy} L${hx + 34} ${hy} L${hx + 30} ${hy - 20} L${hx + 16} ${hy - 28} C ${hx + 28} ${hy - 60}, ${hx + 24} ${hy - 96}, ${hx + 6} ${hy - 118} L${hx + 12} ${hy - 138} L${hx - 2} ${hy - 126} C ${hx - 22} ${hy - 126}, ${hx - 38} ${hy - 104}, ${hx - 48} ${hy - 80} L${hx - 52} ${hy - 64} C ${hx - 50} ${hy - 54}, ${hx - 38} ${hy - 54}, ${hx - 28} ${hy - 64} L${hx - 14} ${hy - 68} C ${hx - 22} ${hy - 48}, ${hx - 30} ${hy - 32}, ${hx - 30} ${hy - 20} Z`
    return {
      accent: '#9aa3ad',
      defs: [body.def, head.def],
      art: `
<path d="${horse}" fill="${head.url}"/>
<path d="M${hx + 4} ${hy - 112} C ${hx + 18} ${hy - 90}, ${hx + 20} ${hy - 60}, ${hx + 10} ${hy - 34}" stroke="${head.dark}" stroke-width="3" fill="none" opacity="0.6"/>
<path d="${shape}" fill="${body.url}"/>
${streak(CX - 96, top + 70, 12, 170, 0.45)}
<path d="${shape}" fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="2"/>
${text('MAAHIR', CX, top + 150, { size: 30, color: '#3d4148', spacing: 6 })}
${text('LEGACY', CX, top + 180, { size: 15, color: '#3d4148', spacing: 7 })}
${text('LATTAFA', CX, FLOOR - 30, { size: 11, color: '#3d4148', spacing: 5, opacity: 0.8 })}`,
    }
  },

  'afnan-supremacy-collector-s-edition': () => {
    const g = sheen('#ece6da', '#fbf8f2', '#bdb5a6')
    const sp = speckle('#2a2622')
    const cap = metal('black')
    const top = 340
    const w = 250
    const x = CX - w / 2
    const h = FLOOR - top
    const clip = id('c')
    const med = medallion(CX, top + 150, 40, 'gunmetal')
    return {
      accent: '#b9a98c',
      defs: [g.def, sp.def, cap.def, ...med.defs, `<clipPath id="${clip}"><rect x="${x}" y="${top}" width="${w}" height="${h}" rx="26"/></clipPath>`],
      art: `
<circle cx="${CX}" cy="${top - 120}" r="54" fill="none" stroke="${cap.base}" stroke-width="16"/>
<circle cx="${CX}" cy="${top - 120}" r="54" fill="none" stroke="${cap.light}" stroke-width="3" opacity="0.5"/>
<rect x="${CX - 30}" y="${top - 74}" width="60" height="80" rx="6" fill="${cap.url}"/>
<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="26" fill="${g.url}"/>
<g clip-path="url(#${clip})"><rect x="${x}" y="${top}" width="${w}" height="${h}" fill="${sp.url}" opacity="0.8"/></g>
<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="26" fill="none" stroke="#000" stroke-opacity="0.15" stroke-width="2"/>
${med.svg}
${text('SUPREMACY', CX, top + 230, { size: 22, color: '#2a2622', spacing: 5 })}
${text("COLLECTOR'S EDITION", CX, top + 254, { size: 11, color: '#2a2622', spacing: 4 })}`,
    }
  },

  'gulf-orchid-mango-ice': () => {
    const g = sheen('#f2b632', '#ffe08a', '#c47e12')
    const top = 350
    const w = 250
    const x = CX - w / 2
    const shape = `M${x + 30} ${top} H ${x + w - 30} Q ${x + w} ${top}, ${x + w} ${top + 40} V ${FLOOR - 16} Q ${x + w} ${FLOOR}, ${x + w - 16} ${FLOOR} H ${x + 16} Q ${x} ${FLOOR}, ${x} ${FLOOR - 16} V ${top + 40} Q ${x} ${top}, ${x + 30} ${top} Z`
    const crown = crownCap(top - 112, 'gold')
    const med = medallion(CX, top + 100, 36, 'gold')
    return {
      accent: '#f2b632',
      defs: [g.def, ...crown.defs, ...med.defs],
      art: `${crown.svg}
<path d="${shape}" fill="${g.url}"/>
${streak(x + 18, top + 30, 12, 200, 0.4)}
<path d="${shape}" fill="none" stroke="#000" stroke-opacity="0.15" stroke-width="2"/>
${med.svg}
${text('MANGO ICE', CX, top + 190, { size: 28, color: '#5a3a08', spacing: 4 })}
${text('BY GULF ORCHID', CX, top + 216, { size: 12, color: '#5a3a08', spacing: 4, opacity: 0.85 })}`,
    }
  },

  'gulf-orchid-yacht-club': () => {
    const g = sheen('#151a2c', '#38415e', '#05070d')
    const top = 350
    const w = 250
    const x = CX - w / 2
    const shape = `M${x + 30} ${top} H ${x + w - 30} Q ${x + w} ${top}, ${x + w} ${top + 40} V ${FLOOR - 16} Q ${x + w} ${FLOOR}, ${x + w - 16} ${FLOOR} H ${x + 16} Q ${x} ${FLOOR}, ${x} ${FLOOR - 16} V ${top + 40} Q ${x} ${top}, ${x + 30} ${top} Z`
    const crown = crownCap(top - 112, 'gold')
    const med = medallion(CX, top + 100, 36, 'gold')
    return {
      accent: '#3a4a78',
      defs: [g.def, ...crown.defs, ...med.defs],
      art: `${crown.svg}
<path d="${shape}" fill="${g.url}"/>
${streak(x + 18, top + 30, 10, 200, 0.18)}
${med.svg}
${text('YACHT CLUB', CX, top + 190, { size: 28, color: '#f0dca0', spacing: 4 })}
${text('BY GULF ORCHID', CX, top + 216, { size: 12, color: '#f0dca0', spacing: 4, opacity: 0.85 })}`,
    }
  },

  'armaf-odyssey-mega': () => {
    const g = sheen('#f2c53a', '#ffe48a', '#b8891a')
    const cap = metal('black')
    const w = 220
    const top = 330
    const x = CX - w / 2
    const h = FLOOR - top
    return {
      accent: '#f2c53a',
      defs: [g.def, cap.def],
      art: `
<path d="M${CX + 40} ${top - 100} h 50 v 70 h -16 v -54 h -34 Z" fill="${cap.base}"/>
<rect x="${CX - 76}" y="${top - 110}" width="152" height="94" rx="20" fill="${cap.url}"/>
<rect x="${CX - 92}" y="${top - 26}" width="184" height="32" rx="8" fill="${cap.url}"/>
<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="22" fill="${g.url}"/>
<line x1="${x + 8}" y1="${top + 14}" x2="${x + w - 8}" y2="${top + 14}" stroke="#8a6a14" stroke-dasharray="6 5" stroke-width="2" opacity="0.6"/>
<line x1="${x + 8}" y1="${FLOOR - 14}" x2="${x + w - 8}" y2="${FLOOR - 14}" stroke="#8a6a14" stroke-dasharray="6 5" stroke-width="2" opacity="0.6"/>
${streak(x + 20, top + 30, 12, h - 80, 0.35)}
${text('ODYSSEY', CX, top + 140, { size: 18, color: '#6b4f0e', spacing: 8 })}
${text('MEGA', CX, top + 196, { size: 52, color: '#6b4f0e', spacing: 8 })}
${text('ARMAF', CX, top + 236, { size: 12, color: '#6b4f0e', spacing: 6, opacity: 0.8 })}`,
    }
  },

  'armaf-club-de-nuit-intense-man': () =>
    rectBottle({
      w: 270, h: 290, rx: 10, glass: ['#141416', '#3a3a40', '#000000'], capTone: 'black', capW: 76, capH: 76,
      label: 'Club de Nuit', sub: 'Intense Man', labelColor: '#d9d9de', accent: '#55585e',
    }),

  'maison-asrar-dxb': () => {
    const g = sheen('#e9e4dc', '#ffffff', '#b7b0a5')
    const juice = sheen('#f0c98a', '#fae3b8', '#c99a54')
    const frame = metal('silver')
    const lat = lattice(frame.dark, 22, 2)
    const w = 240
    const h = 310
    const top = FLOOR - h
    const x = CX - w / 2
    const clip = id('c')
    return {
      accent: '#c0c4ca',
      defs: [g.def, juice.def, frame.def, lat.def, `<clipPath id="${clip}"><rect x="${x}" y="${top}" width="${w}" height="${h}" rx="8"/></clipPath>`],
      art: `
<rect x="${CX - 22}" y="${top - 22}" width="44" height="26" fill="${frame.url}"/>
<rect x="${CX - 62}" y="${top - 140}" width="124" height="120" rx="6" fill="${frame.url}"/>
<rect x="${CX - 48}" y="${top - 126}" width="96" height="92" rx="4" fill="none" stroke="${frame.dark}" stroke-width="3"/>
<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="8" fill="${g.url}" opacity="0.92"/>
<g clip-path="url(#${clip})">
<rect x="${x + 30}" y="${top + 40}" width="${w - 60}" height="${h - 56}" fill="${juice.url}" opacity="0.7"/>
<rect x="${x}" y="${top}" width="${w}" height="${h}" fill="none" stroke="${lat.url}" stroke-width="56"/>
</g>
<rect x="${x + 2}" y="${top + 2}" width="${w - 4}" height="${h - 4}" rx="8" fill="none" stroke="${frame.base}" stroke-width="6"/>
<rect x="${x + 28}" y="${top + 28}" width="${w - 56}" height="${h - 56}" fill="none" stroke="${frame.base}" stroke-width="4"/>
${text('DXB', CX, top + h * 0.56, { size: 56, color: '#4a4033', spacing: 6 })}
${text('MAISON ASRAR', CX, top + h * 0.56 + 30, { size: 11, color: '#4a4033', spacing: 4 })}`,
    }
  },

  'coach-coach-blue': () =>
    coachBottle({ glass: ['#2c4fa8', '#7aa0f0', '#16285e'], label: 'Blue', accent: '#3d63c4' }),

  'coach-coach-green': () =>
    coachBottle({ glass: ['#2f7a4a', '#7cc89a', '#163f25'], label: 'Green', accent: '#3a8a58' }),

  'arabiat-prestige-marwa': () => {
    const g = sheen('#cfd2d6', '#f7f8fa', '#8d9198')
    const cap = metal('gunmetal')
    const top = 380
    const shape = `M${CX - 70} ${top} H ${CX + 70} L ${CX + 120} ${top + 60} V ${FLOOR - 40} L ${CX + 90} ${FLOOR} H ${CX - 90} L ${CX - 120} ${FLOOR - 40} V ${top + 60} Z`
    const gem = `M${CX - 70} ${top - 40} L ${CX - 44} ${top - 120} L ${CX + 44} ${top - 120} L ${CX + 70} ${top - 40} L ${CX + 30} ${top - 14} H ${CX - 30} Z`
    return {
      accent: '#a7acb4',
      defs: [g.def, cap.def],
      art: `
<rect x="${CX - 26}" y="${top - 22}" width="52" height="26" fill="${cap.url}"/>
<path d="${gem}" fill="${cap.url}"/>
<path d="M${CX - 44} ${top - 120} L ${CX - 12} ${top - 60} L ${CX - 70} ${top - 40} M${CX + 44} ${top - 120} L ${CX + 12} ${top - 60} L ${CX + 70} ${top - 40} M${CX - 12} ${top - 60} H ${CX + 12} M${CX - 12} ${top - 60} L ${CX - 30} ${top - 14} M${CX + 12} ${top - 60} L ${CX + 30} ${top - 14}" stroke="${cap.light}" stroke-width="2" fill="none" opacity="0.6"/>
<path d="${shape}" fill="${g.url}"/>
<path d="M${CX - 70} ${top} L ${CX - 30} ${top + 70} H ${CX + 30} L ${CX + 70} ${top} M${CX - 120} ${top + 60} L ${CX - 30} ${top + 70} M${CX + 120} ${top + 60} L ${CX + 30} ${top + 70}" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.6"/>
<path d="${shape}" fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="2"/>
${text('MARWA', CX, top + 150, { size: 30, color: '#3a3d42', spacing: 6 })}
${text('ARABIYAT PRESTIGE', CX, top + 178, { size: 11, color: '#3a3d42', spacing: 3 })}`,
    }
  },

  'arabiyat-prestige-aristo': () => {
    const g = sheen('#b88a4e', '#f1d49a', '#6e4c22')
    const cap = metal('gold')
    const w = 200
    const top = 300
    const x = CX - w / 2
    const h = FLOOR - top
    let ribs = ''
    for (let i = 0; i < 11; i += 1) {
      ribs += `<rect x="${x + 10 + i * 17}" y="${top + 8}" width="8" height="${h - 16}" rx="4" fill="#000" opacity="0.14"/>`
    }
    let capRibs = ''
    for (let i = 0; i < 7; i += 1) {
      capRibs += `<rect x="${CX - 40}" y="${top - 118 + i * 13}" width="80" height="5" rx="2" fill="${cap.dark}" opacity="0.5"/>`
    }
    return {
      accent: '#c99a54',
      defs: [g.def, cap.def],
      art: `
<rect x="${CX - 22}" y="${top - 26}" width="44" height="30" fill="${cap.url}"/>
<path d="M${CX - 44} ${top - 26} V ${top - 100} C ${CX - 44} ${top - 150}, ${CX + 44} ${top - 150}, ${CX + 44} ${top - 100} V ${top - 26} Z" fill="${cap.url}"/>
${capRibs}
<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="26" fill="${g.url}"/>
${ribs}
<rect x="${CX - 62}" y="${top + 120}" width="124" height="80" rx="4" fill="#2a1d0e" stroke="${cap.light}" stroke-width="3"/>
${text('ARISTO', CX, top + 160, { size: 26, color: '#f6e3a6', spacing: 4 })}
${text('ARABIYAT PRESTIGE', CX, top + 184, { size: 9, color: '#f6e3a6', spacing: 2 })}`,
    }
  },

  'french-avenue-aether-extrait': () => {
    const g = sheen('#efe3e6', '#ffffff', '#c4b2b8')
    const juice = sheen('#f2c9cf', '#fde6ea', '#d49ea8')
    const cap = metal('gold')
    const top = 360
    const shape = `M${CX - 100} ${top} H ${CX + 110} L ${CX + 130} ${top + 120} L ${CX + 112} ${FLOOR} H ${CX - 118} L ${CX - 132} ${top + 140} Z`
    const clip = id('c')
    return {
      accent: '#d9b0b8',
      defs: [g.def, juice.def, cap.def, `<clipPath id="${clip}"><path d="${shape}"/></clipPath>`],
      art: `
<rect x="${CX - 24}" y="${top - 22}" width="48" height="26" fill="${cap.url}"/>
<path d="M${CX - 92} ${top - 22} L ${CX - 80} ${top - 96} L ${CX + 96} ${top - 128} L ${CX + 92} ${top - 22} Z" fill="${cap.url}"/>
<path d="M${CX - 80} ${top - 96} L ${CX + 10} ${top - 60} L ${CX + 96} ${top - 128} M${CX + 10} ${top - 60} V ${top - 22}" stroke="${cap.dark}" stroke-width="2" fill="none" opacity="0.5"/>
<path d="${shape}" fill="${g.url}"/>
<g clip-path="url(#${clip})">
<rect x="${CX - 140}" y="${top + 30}" width="280" height="260" fill="${juice.url}" opacity="0.8"/>
<path d="M${CX - 100} ${top} L ${CX - 20} ${top + 110} L ${CX + 130} ${top + 120} M${CX - 20} ${top + 110} L ${CX - 132} ${top + 140} M${CX - 20} ${top + 110} L ${CX + 20} ${FLOOR} M${CX + 110} ${top} L ${CX - 20} ${top + 110}" stroke="#ffffff" stroke-width="3" fill="none" opacity="0.65"/>
</g>
<path d="${shape}" fill="none" stroke="#000" stroke-opacity="0.15" stroke-width="2"/>
<rect x="${CX - 66}" y="${top + 168}" width="132" height="52" rx="3" fill="#ffffff" opacity="0.75"/>
${text('AETHER', CX, top + 198, { size: 24, color: '#6a4c52', spacing: 5 })}
${text('EXTRAIT', CX, top + 214, { size: 10, color: '#6a4c52', spacing: 5 })}`,
    }
  },

  'french-avenue-liquid-brun': () => {
    const gold = metal('gold')
    const r = rectBottle({
      w: 190, h: 320, rx: 6, glass: ['#6b4430', '#a87a5c', '#3a2418'], capTone: 'brown', capW: 96, capH: 92, capShape: 'octagon',
      neckTone: 'gold', accent: '#8a5a3c',
      extra: '',
    })
    const top = FLOOR - 320
    r.defs.push(gold.def)
    r.art += `
<rect x="${CX - 28}" y="${top + 92}" width="56" height="56" fill="none" stroke="${gold.url}" stroke-width="7"/>
<rect x="${CX - 12}" y="${top + 108}" width="24" height="24" fill="${gold.url}"/>
${text('LIQUID', CX, top + 222, { size: 22, color: '#f1d9a8', spacing: 5 })}
${text('BRUN', CX, top + 250, { size: 22, color: '#f1d9a8', spacing: 5 })}
${text('FRENCH AVENUE', CX, top + 276, { size: 10, color: '#f1d9a8', spacing: 3, opacity: 0.8 })}`
    return r
  },

  'michael-malul-ocean-noir': () =>
    rectBottle({
      w: 240, h: 270, rx: 10, glass: ['#3a2f9a', '#7a6ee0', '#1a1250'], juice: ['#6b5fe0', '#a69cf5', '#3a2fa0'], juiceLevel: 0.85,
      capTone: 'silver', capW: 54, capH: 96, capRx: 6, capShape: 'cylinder',
      label: 'Ocean Noir', sub: 'Michael Malul', labelColor: '#eef0ff', accent: '#5b4fd0',
    }),

  'azzaro-the-most-wanted': () => {
    const g = sheen('#1b1b1e', '#45454c', '#050506')
    const juice = sheen('#b5482a', '#e9874f', '#6e2210')
    const cap = metal('black')
    const w = 230
    const h = 300
    const top = FLOOR - h
    const x = CX - w / 2
    const clip = id('c')
    return {
      accent: '#b5482a',
      defs: [g.def, juice.def, cap.def, `<clipPath id="${clip}"><rect x="${x}" y="${top}" width="${w}" height="${h}" rx="44"/></clipPath>`],
      art: `
<rect x="${CX - 50}" y="${top - 110}" width="100" height="116" rx="12" fill="${cap.url}"/>
<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="44" fill="${juice.url}"/>
<g clip-path="url(#${clip})"><rect x="${x}" y="${top}" width="${w}" height="${h * 0.58}" fill="${g.url}"/>
<rect x="${x}" y="${top + h * 0.58}" width="${w}" height="4" fill="#d9d9de" opacity="0.6"/></g>
${streak(x + 20, top + h * 0.62, 10, h * 0.3, 0.35)}
${text('THE MOST', CX, top + 110, { size: 22, color: '#d9d9de', spacing: 5 })}
${text('WANTED', CX, top + 140, { size: 22, color: '#d9d9de', spacing: 5 })}
${text('AZZARO', CX, top + 226, { size: 12, color: '#fff2e6', spacing: 6 })}`,
    }
  },

  'khadlaj-kaaf': () =>
    rectBottle({
      w: 170, h: 330, rx: 30, glass: ['#e6ecef', '#ffffff', '#b6c1c7'], juice: ['#f3d6a6', '#fbebcd', '#d8b07a'], juiceLevel: 0.75,
      capTone: 'white', capW: 130, capH: 84, capRx: 14, capShape: 'cylinder',
      label: 'Kaaf', sub: 'Khadlaj', labelColor: '#4a3e2c', accent: '#c8b48a',
    }),

  'calvin-klein-ck-one': () => {
    const g = sheen('#e8ece6', '#ffffff', '#b9c0b6')
    const cap = metal('silver')
    const top = 330
    const shape = `M${CX - 40} ${top} C ${CX - 60} ${top + 30}, ${CX - 130} ${top + 50}, ${CX - 130} ${top + 120} V ${FLOOR - 30} Q ${CX - 130} ${FLOOR}, ${CX - 100} ${FLOOR} H ${CX + 100} Q ${CX + 130} ${FLOOR}, ${CX + 130} ${FLOOR - 30} V ${top + 120} C ${CX + 130} ${top + 50}, ${CX + 60} ${top + 30}, ${CX + 40} ${top} Z`
    return {
      accent: '#a9b4a2',
      defs: [g.def, cap.def],
      art: `
<rect x="${CX - 28}" y="${top - 46}" width="56" height="50" rx="4" fill="${cap.url}"/>
<rect x="${CX - 16}" y="${top - 62}" width="32" height="18" rx="2" fill="${cap.url}"/>
<path d="${shape}" fill="${g.url}" opacity="0.95"/>
${streak(CX - 110, top + 110, 12, 150, 0.6)}
<path d="${shape}" fill="none" stroke="#000" stroke-opacity="0.14" stroke-width="2"/>
${text('ck', CX, top + 210, { size: 96, color: '#1d1d1f', spacing: -2, family: "Helvetica, Arial, sans-serif" })}
${text('one', CX + 30, top + 236, { size: 18, color: '#1d1d1f', spacing: 1, family: "Helvetica, Arial, sans-serif" })}
${text('CALVIN KLEIN', CX, FLOOR - 24, { size: 10, color: '#1d1d1f', spacing: 4, family: "Helvetica, Arial, sans-serif", opacity: 0.7 })}`,
    }
  },

  'khadlaj-shiyaaka-snow': () => {
    const g = sheen('#f1ece2', '#ffffff', '#cfc7b8')
    const tx = texture('#bfb6a4')
    const w = 250
    const h = 300
    const top = FLOOR - h
    const x = CX - w / 2
    const clip = id('c')
    return {
      accent: '#d8d0c0',
      defs: [g.def, tx.def, `<clipPath id="${clip}"><rect x="${x}" y="${top - 70}" width="${w}" height="${h + 70}" rx="34"/></clipPath>`],
      art: `
<rect x="${x}" y="${top - 70}" width="${w}" height="${h + 70}" rx="34" fill="${g.url}"/>
<g clip-path="url(#${clip})"><rect x="${x}" y="${top - 70}" width="${w}" height="${h + 70}" fill="${tx.url}" opacity="0.55"/>
<line x1="${x}" y1="${top + 2}" x2="${x + w}" y2="${top + 2}" stroke="#a9a090" stroke-width="2"/></g>
<rect x="${x}" y="${top - 70}" width="${w}" height="${h + 70}" rx="34" fill="none" stroke="#000" stroke-opacity="0.12" stroke-width="2"/>
<rect x="${CX - 70}" y="${top + 90}" width="140" height="78" rx="4" fill="#ffffff" stroke="#c9c1b1"/>
${text('SHIYAAKA', CX, top + 126, { size: 20, color: '#3d3a33', spacing: 4 })}
${text('SNOW', CX, top + 152, { size: 14, color: '#3d3a33', spacing: 6 })}
${text('KHADLAJ', CX, FLOOR - 26, { size: 10, color: '#3d3a33', spacing: 5, opacity: 0.7 })}`,
    }
  },

  'burberry-burberry-touch-for-men': () =>
    rectBottle({
      w: 200, h: 270, rx: 8, glass: ['#efe7e0', '#ffffff', '#c9bdb2'], juice: ['#f3cfb6', '#fbe6d8', '#d9a888'], juiceLevel: 0.8,
      capTone: 'brown', capW: 110, capH: 96, capShape: 'cone',
      label: 'Burberry', sub: 'Touch for Men', labelColor: '#5a4636', accent: '#c7a88e',
    }),

  'lattafa-musamam-black-intense': () => {
    const g = sheen('#1a1a1d', '#45454c', '#050506')
    const juice = sheen('#7a2a24', '#b8544a', '#3e100c')
    const cap = metal('black')
    const w = 200
    const h = 320
    const top = FLOOR - h
    const x = CX - w / 2
    let coils = ''
    for (let i = 0; i < 4; i += 1) {
      coils += `<rect x="${CX - 92}" y="${top - 104 + i * 22}" width="184" height="18" rx="9" fill="${cap.url}" stroke="${cap.light}" stroke-opacity="0.35"/>`
    }
    const clip = id('c')
    return {
      accent: '#7a2a24',
      defs: [g.def, juice.def, cap.def, `<clipPath id="${clip}"><rect x="${x}" y="${top}" width="${w}" height="${h}" rx="20"/></clipPath>`],
      art: `
<rect x="${CX - 88}" y="${top - 150}" width="176" height="60" rx="14" fill="${cap.url}"/>
${coils}
<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="20" fill="${g.url}"/>
<g clip-path="url(#${clip})"><rect x="${x}" y="${top + h * 0.7}" width="${w}" height="${h * 0.3}" fill="${juice.url}"/></g>
${streak(x + 16, top + 20, 10, h - 80, 0.18)}
${text('MUSAMAM', CX, top + 120, { size: 24, color: '#c9554a', spacing: 4 })}
${text('BLACK INTENSE', CX, top + 146, { size: 12, color: '#e9e2dc', spacing: 4 })}
${text('LATTAFA', CX, top + 176, { size: 11, color: '#e9e2dc', spacing: 5, opacity: 0.8 })}`,
    }
  },

  'lattafa-asad-elixir': () => {
    const g = sheen('#18181b', '#45454c', '#050506')
    const rose = metal('rose')
    const cap = metal('black')
    const w = 200
    const h = 320
    const top = FLOOR - h
    const x = CX - w / 2
    const med = medallion(CX, top + 120, 26, 'rose')
    return {
      accent: '#c99a86',
      defs: [g.def, rose.def, cap.def, ...med.defs],
      art: `
<rect x="${CX - 92}" y="${top - 112}" width="184" height="104" rx="40" fill="${cap.url}"/>
<rect x="${x}" y="${top - 12}" width="${w}" height="${h + 12}" rx="34" fill="${g.url}"/>
<rect x="${x - 6}" y="${top + 100}" width="${w + 12}" height="40" rx="6" fill="${rose.url}"/>
${med.svg}
${streak(x + 16, top + 20, 10, h - 80, 0.15)}
${text('ASAD', CX, top + 206, { size: 30, color: '#f5dccf', spacing: 8 })}
${text('ELIXIR', CX, top + 232, { size: 14, color: '#f5dccf', spacing: 7 })}
${text('LATTAFA', CX, top + 270, { size: 11, color: '#f5dccf', spacing: 5, opacity: 0.8 })}`,
    }
  },

  'afnan-turathi-blue': () =>
    amphora({ glass: ['#2a4f9e', '#6f97e8', '#122656'], capTone: 'silver', label: 'Turathi', accent: '#3a63c0', labelColor: '#e9f0ff' }),

  'afnan-turathi-electric': () =>
    amphora({ glass: ['#e7eef0', '#ffffff', '#b3c2c7'], juice: ['#f3df8a', '#fbefbf', '#d4b64c'], capTone: 'gunmetal', label: 'Turathi', accent: '#d4b64c', labelColor: '#6a5310' }),

  'rayhaan-rayhaan-aquatica': () =>
    latticeBottle({ glass: ['#5fb7c9', '#b6e7f0', '#2d7486'], tone: 'silver', sub: 'Aquatica', accent: '#5fb7c9' }),

  'rayhaan-rayhaan-elixir': () =>
    latticeBottle({ glass: ['#c7863a', '#f0c27e', '#7a4a16'], tone: 'gold', sub: 'Elixir', accent: '#c7863a' }),

  'rayhaan-rayhaan-obsidian': () =>
    latticeBottle({ glass: ['#1c1c20', '#45454c', '#060607'], tone: 'gunmetal', sub: 'Obsidian', accent: '#55585e' }),

  'rayhaan-rayhaan-tera': () =>
    latticeBottle({ glass: ['#8a5a3c', '#c4906a', '#4a2c18'], tone: 'rose', sub: 'Tera', accent: '#a86e4c' }),

  'rayhaan-rayhaan-pacific': () => {
    const r = rectBottle({
      w: 260, h: 280, rx: 10, glass: ['#2d4fb8', '#7b9cf2', '#142a6e'], capTone: 'gold', capW: 70, capH: 82, capShape: 'cylinder',
      neckTone: 'gold', accent: '#3d63c4',
    })
    const top = FLOOR - 280
    r.art += `
<path d="M${CX - 80} ${top + 70} c 40 -30, 80 30, 120 0 s 40 40, 0 70 s -90 10, -60 50 s 90 20, 100 -20" fill="none" stroke="#dfe7ff" stroke-width="7" stroke-linecap="round" opacity="0.85"/>
<path d="M${CX - 60} ${top + 160} c 20 20, 60 20, 90 -10" fill="none" stroke="#dfe7ff" stroke-width="5" stroke-linecap="round" opacity="0.7"/>
${text('RAYHAAN', CX, top + 230, { size: 22, color: '#ffffff', spacing: 6 })}
${text('PACIFIC', CX, top + 254, { size: 12, color: '#ffffff', spacing: 6, opacity: 0.85 })}`
    return r
  },

  'chanel-bleu-de-chanel': () =>
    rectBottle({
      w: 270, h: 300, rx: 6, glass: ['#141c36', '#34426e', '#060a18'], capTone: 'black', capW: 120, capH: 70, capRx: 4,
      label: 'Bleu', sub: 'de Chanel', labelColor: '#c9cfe0', accent: '#2a3a6e',
    }),
}

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'fragrance-art')
mkdirSync(outDir, { recursive: true })

for (const [slug, build] of Object.entries(bottles)) {
  const { accent, defs, art } = build()
  writeFileSync(resolve(outDir, `${slug}.svg`), scene({ accent, defs, art }))
}

// The storefront reads this list to know which products have an illustration.
const listPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'fragrance-art.json')
mkdirSync(dirname(listPath), { recursive: true })
writeFileSync(listPath, `${JSON.stringify(Object.keys(bottles).sort(), null, 2)}\n`)

console.log(`Wrote ${Object.keys(bottles).length} illustrations to ${outDir}`)
