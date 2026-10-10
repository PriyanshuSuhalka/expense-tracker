// Generates PNG icons (and favicon) from an inline SVG. Run: npm run icons
import sharp from 'sharp'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

// Glyph: microphone with a sound arc, drawn on a 512 grid inside a safe zone so it survives maskable cropping.
const glyph = `
  <g fill="none" stroke="#fff" stroke-width="26" stroke-linecap="round" stroke-linejoin="round">
    <rect x="212" y="120" width="88" height="170" rx="44" fill="#fff"/>
    <path d="M160 250a96 96 0 00192 0"/>
    <path d="M256 346v50M212 396h88"/>
  </g>`
const svg = (rounded) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#14b8a6"/><stop offset="1" stop-color="#0f766e"/></linearGradient></defs>
  <rect width="512" height="512" ${rounded ? 'rx="112"' : ''} fill="url(#g)"/>${glyph}</svg>`

writeFileSync(join(out, 'favicon.svg'), svg(true))
const png = (rounded, size, name) => sharp(Buffer.from(svg(rounded))).resize(size, size).png().toFile(join(out, name))
await Promise.all([
  png(true, 192, 'icon-192.png'),
  png(true, 512, 'icon-512.png'),
  png(false, 512, 'icon-maskable-512.png'), // full-bleed so the OS mask can crop it
  png(false, 180, 'apple-touch-icon.png'),
])
console.log('icons written to', out)
