// Generates installable PWA icon PNGs from the editorial SVG logo without extra image dependencies.

import { deflateSync } from 'node:zlib'
import { readFileSync, writeFileSync } from 'node:fs'

const sourceLogoPath = 'public/brand/logo-editorial.svg'
const iconTargets = [
  { size: 192, path: 'public/pwa-192x192.png' },
  { size: 512, path: 'public/pwa-512x512.png' },
]

const logoSvg = readFileSync(sourceLogoPath, 'utf8')
const logoModel = parseLogoSvg(logoSvg)

for (const target of iconTargets) {
  writeFileSync(target.path, createIconPng(target.size, logoModel))
}

function parseLogoSvg(svg) {
  const rects = [...svg.matchAll(/<rect\b([^>]*)\/>/g)].map(match => parseAttributes(match[1]))
  const circle = parseAttributes(svg.match(/<circle\b([^>]*)\/>/)?.[1] ?? '')

  return {
    shadowRect: rects[0],
    cardRect: rects[1],
    lines: [
      { x1: 24, y1: 27, x2: 40, y2: 27, strokeWidth: 4 },
      { x1: 24, y1: 37, x2: 37, y2: 37, strokeWidth: 4 },
    ],
    circle,
  }
}

function parseAttributes(rawAttributes) {
  return Object.fromEntries(
    [...rawAttributes.matchAll(/([a-z-]+)="([^"]+)"/g)].map(([, key, value]) => [
      key,
      Number.isFinite(Number(value)) ? Number(value) : value,
    ]),
  )
}

function createIconPng(size, logo) {
  const pixels = Buffer.alloc(size * size * 4)
  const scale = size / 64
  const canvas = createCanvas(pixels, size)

  canvas.clear('#f5f1ec')
  canvas.roundRect(scaleRect(logo.shadowRect, scale), '#111111', 0.14)
  canvas.roundRect(scaleRect(logo.cardRect, scale), '#ffffff', 1)
  canvas.strokeRoundRect(scaleRect(logo.cardRect, scale), scale * 4, '#111111', 1)

  for (const line of logo.lines) {
    canvas.line(line.x1 * scale, line.y1 * scale, line.x2 * scale, line.y2 * scale, line.strokeWidth * scale, '#111111')
  }

  canvas.circle(logo.circle.cx * scale, logo.circle.cy * scale, logo.circle.r * scale, '#ff5600', 1)

  return encodePng(size, size, pixels)
}

function createCanvas(pixels, size) {
  return {
    clear(color) {
      const rgba = parseColor(color, 1)

      for (let offset = 0; offset < pixels.length; offset += 4) {
        pixels[offset] = rgba.r
        pixels[offset + 1] = rgba.g
        pixels[offset + 2] = rgba.b
        pixels[offset + 3] = rgba.a
      }
    },
    roundRect(rect, color, opacity) {
      fillShape(pixels, size, color, opacity, (x, y) => isInRoundedRect(x, y, rect))
    },
    strokeRoundRect(rect, strokeWidth, color, opacity) {
      fillShape(
        pixels,
        size,
        color,
        opacity,
        (x, y) => isInRoundedRect(x, y, rect) && !isInRoundedRect(x, y, insetRect(rect, strokeWidth)),
      )
    },
    line(x1, y1, x2, y2, strokeWidth, color) {
      const radius = strokeWidth / 2

      fillShape(pixels, size, color, 1, (x, y) => distanceToSegment(x, y, x1, y1, x2, y2) <= radius)
    },
    circle(cx, cy, radius, color, opacity) {
      fillShape(pixels, size, color, opacity, (x, y) => Math.hypot(x - cx, y - cy) <= radius)
    },
  }
}

function scaleRect(rect, scale) {
  return {
    x: rect.x * scale,
    y: rect.y * scale,
    width: rect.width * scale,
    height: rect.height * scale,
    rx: rect.rx * scale,
  }
}

function insetRect(rect, inset) {
  return {
    x: rect.x + inset,
    y: rect.y + inset,
    width: Math.max(0, rect.width - inset * 2),
    height: Math.max(0, rect.height - inset * 2),
    rx: Math.max(0, rect.rx - inset),
  }
}

function fillShape(pixels, size, color, opacity, containsPoint) {
  const rgba = parseColor(color, opacity)
  const samples = [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.25, 0.75],
    [0.75, 0.75],
  ]

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const coverage =
        samples.filter(([sampleX, sampleY]) => containsPoint(x + sampleX, y + sampleY)).length / samples.length

      if (coverage > 0) {
        blendPixel(pixels, (y * size + x) * 4, rgba, coverage)
      }
    }
  }
}

function isInRoundedRect(x, y, rect) {
  const right = rect.x + rect.width
  const bottom = rect.y + rect.height

  if (x < rect.x || x > right || y < rect.y || y > bottom) {
    return false
  }

  const cornerX = x < rect.x + rect.rx ? rect.x + rect.rx : x > right - rect.rx ? right - rect.rx : x
  const cornerY = y < rect.y + rect.rx ? rect.y + rect.rx : y > bottom - rect.rx ? bottom - rect.rx : y

  return Math.hypot(x - cornerX, y - cornerY) <= rect.rx
}

function distanceToSegment(x, y, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const lengthSquared = dx * dx + dy * dy
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSquared))

  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy))
}

function parseColor(hex, opacity) {
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
    a: Math.round(255 * opacity),
  }
}

function blendPixel(pixels, offset, source, coverage) {
  const alpha = (source.a / 255) * coverage
  const inverseAlpha = 1 - alpha

  pixels[offset] = Math.round(source.r * alpha + pixels[offset] * inverseAlpha)
  pixels[offset + 1] = Math.round(source.g * alpha + pixels[offset + 1] * inverseAlpha)
  pixels[offset + 2] = Math.round(source.b * alpha + pixels[offset + 2] * inverseAlpha)
  pixels[offset + 3] = 255
}

function encodePng(width, height, pixels) {
  const rawRows = []

  for (let y = 0; y < height; y += 1) {
    rawRows.push(Buffer.from([0]), pixels.subarray(y * width * 4, (y + 1) * width * 4))
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    createChunk('IHDR', createIhdr(width, height)),
    createChunk('IDAT', deflateSync(Buffer.concat(rawRows))),
    createChunk('IEND', Buffer.alloc(0)),
  ])
}

function createIhdr(width, height) {
  const data = Buffer.alloc(13)

  data.writeUInt32BE(width, 0)
  data.writeUInt32BE(height, 4)
  data[8] = 8
  data[9] = 6

  return data
}

function createChunk(type, data) {
  const typeBuffer = Buffer.from(type)
  const chunk = Buffer.alloc(12 + data.length)

  chunk.writeUInt32BE(data.length, 0)
  typeBuffer.copy(chunk, 4)
  data.copy(chunk, 8)
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length)

  return chunk
}

function crc32(buffer) {
  let crc = 0xffffffff

  for (const byte of buffer) {
    crc ^= byte

    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1
    }
  }

  return (crc ^ 0xffffffff) >>> 0
}
