// Letras 5×7. '#' es tinta, '.' es aire.
const GLYPHS = {
  S: ['.###.', '#....', '#....', '.###.', '....#', '....#', '###..'],
  Q: ['.###.', '#...#', '#...#', '#.#.#', '#..#.', '.##.#', '...#.'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
}

const DIGITS = {
  0: ['###', '#.#', '#.#', '#.#', '###'],
  1: ['.#.', '##.', '.#.', '.#.', '###'],
  2: ['###', '..#', '###', '#..', '###'],
  3: ['###', '..#', '###', '..#', '###'],
  4: ['#.#', '#.#', '###', '..#', '..#'],
  5: ['###', '#..', '###', '..#', '###'],
  6: ['###', '#..', '###', '#.#', '###'],
  7: ['###', '..#', '..#', '.#.', '.#.'],
  8: ['###', '#.#', '###', '#.#', '###'],
  9: ['###', '#.#', '###', '..#', '###'],
  B: ['##.', '#.#', '##.', '#.#', '##.'],
  P: ['##.', '#.#', '##.', '#..', '#..'],
  M: ['#.#', '###', '#.#', '#.#', '#.#'],
}

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function onCells(glyph) {
  const cells = []
  glyph.forEach((row, y) => {
    ;[...row].forEach((ch, x) => {
      if (ch === '#') cells.push([x, y])
    })
  })
  return cells
}

function stamp(ctx, glyph, ox, oy, pixel, color, holes, rowShift, bleed = 0) {
  glyph.forEach((row, y) => {
    const slide = y === rowShift ? 1 : 0
    ;[...row].forEach((ch, x) => {
      if (ch !== '#') return
      if (holes?.has(`${x},${y}`)) return
      ctx.fillStyle = color
      ctx.fillRect(
        ox + (x + slide) * pixel - bleed,
        oy + y * pixel - bleed,
        pixel + bleed * 2,
        pixel + bleed * 2,
      )
    })
  })
}

// Dibuja la letra en un canvas cuadrado. La sombra naranja va corrida,
// faltan píxeles y una fila puede ir un bloque fuera de sitio.
export function letterCanvas(letter, seed, slop) {
  const glyph = GLYPHS[letter]
  if (!glyph) throw new Error(`No hay dibujo para la letra ${letter}`)

  const pixel = 20
  const size = 260
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const rng = mulberry32(seed * 97 + 13)
  const cells = onCells(glyph)
  const holes = new Set()
  for (let i = 0; i < slop.holes; i += 1) {
    const [x, y] = cells[Math.floor(rng() * cells.length)]
    holes.add(`${x},${y}`)
  }
  const rowShift = 1 + Math.floor(rng() * (glyph.length - 2))

  ctx.clearRect(0, 0, size, size)
  ctx.save()
  ctx.translate(size / 2, size / 2)
  ctx.rotate((rng() - 0.5) * 2 * slop.tilt)
  const originX = -((glyph[0].length * pixel) / 2) + (rng() - 0.5) * pixel
  const originY = -((glyph.length * pixel) / 2) + (rng() - 0.5) * pixel
  const nudge = slop.shift * pixel

  stamp(ctx, glyph, originX + nudge, originY + nudge * 0.65, pixel, '#FF5C1C', null, -1)
  stamp(ctx, glyph, originX, originY, pixel, '#1A0A14', holes, rowShift, 3)
  stamp(ctx, glyph, originX, originY, pixel, '#3A1280', holes, rowShift)

  for (let i = 0; i < slop.extras; i += 1) {
    const [x, y] = cells[Math.floor(rng() * cells.length)]
    const dx = Math.floor(rng() * 3) - 1
    const dy = Math.floor(rng() * 3) - 1
    ctx.fillStyle = rng() > 0.5 ? '#FF5C1C' : '#3A1280'
    ctx.fillRect(originX + (x + dx) * pixel, originY + (y + dy) * pixel, pixel, pixel)
  }

  const drip = cells[Math.floor(rng() * cells.length)]
  ctx.fillStyle = '#3A1280'
  for (let i = 1; i <= 2; i += 1) {
    ctx.fillRect(originX + drip[0] * pixel, originY + (drip[1] + i) * pixel, pixel, pixel)
  }
  ctx.restore()
  return canvas
}

export function screenCanvas(bpm) {
  const canvas = document.createElement('canvas')
  canvas.width = 320
  canvas.height = 120
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#FFF1A8'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = '#1A0A14'
  ctx.lineWidth = 10
  ctx.strokeRect(5, 5, 310, 110)

  const text = String(Math.round(bpm))
  const pixel = 12
  const gap = 6
  const width = [...text].reduce((sum, ch) => sum + DIGITS[ch][0].length * pixel + gap, -gap)
  let x = (canvas.width - width) / 2
  const y = 22
  for (const ch of text) {
    const glyph = DIGITS[ch]
    stamp(ctx, glyph, x, y, pixel, '#3A1280', null, -1)
    x += glyph[0].length * pixel + gap
  }

  const label = 'BPM'
  const small = 6
  const labelWidth = [...label].reduce((sum, ch) => sum + DIGITS[ch][0].length * small + 4, -4)
  let lx = (canvas.width - labelWidth) / 2
  for (const ch of label) {
    const glyph = DIGITS[ch]
    stamp(ctx, glyph, lx, 86, small, '#FF5C1C', null, -1)
    lx += glyph[0].length * small + 4
  }
  return canvas
}

export { GLYPHS }
