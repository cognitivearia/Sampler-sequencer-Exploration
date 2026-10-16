import { PADS, STEPS } from './config.js'

// Probabilidad de que un golpe caiga en cada paso al pulsar Aleatorio.
// 1 = siempre, 0 = nunca. El orden de cada lista es el de los 16 pasos.
const WEIGHTS = {
  kick: [1, 0.05, 0.1, 0.6, 0.08, 0.05, 0.45, 0.08, 1, 0.05, 0.12, 0.55, 0.08, 0.05, 0.3, 0.08],
  snare: [0, 0, 0.05, 0, 0.95, 0.05, 0.08, 0.15, 0, 0, 0.05, 0.1, 0.95, 0.05, 0.2, 0.25],
  hat: [0.8, 0.25, 0.75, 0.3, 0.8, 0.25, 0.75, 0.3, 0.8, 0.25, 0.75, 0.3, 0.8, 0.25, 0.7, 0.2],
  openhat: [0, 0.05, 0.2, 0.05, 0, 0.05, 0.15, 0, 0, 0.05, 0.35, 0.05, 0, 0.08, 0.2, 0],
  clap: [0, 0, 0, 0, 0.7, 0, 0, 0.1, 0, 0, 0, 0, 0.75, 0, 0.1, 0.15],
  tomLow: [0, 0, 0, 0.05, 0, 0, 0.08, 0.2, 0, 0, 0, 0.05, 0, 0.1, 0.35, 0.45],
  tomMid: [0, 0, 0, 0, 0, 0.1, 0.15, 0.1, 0, 0, 0, 0, 0, 0.2, 0.25, 0.15],
  rim: [0.1, 0, 0.15, 0, 0, 0.1, 0.35, 0, 0.1, 0, 0.2, 0, 0, 0.1, 0.3, 0],
  shaker: [0.2, 0.55, 0.2, 0.5, 0.15, 0.55, 0.2, 0.5, 0.2, 0.55, 0.2, 0.5, 0.15, 0.55, 0.2, 0.4],
  cowbell: [0, 0, 0.28, 0, 0, 0, 0.12, 0, 0, 0, 0.28, 0, 0, 0, 0.12, 0],
  crash: [0.22, 0, 0, 0, 0, 0, 0, 0, 0.08, 0, 0, 0, 0, 0, 0, 0],
  perc: [0, 0.15, 0, 0.3, 0, 0.1, 0, 0.25, 0, 0.15, 0, 0.35, 0, 0.1, 0, 0.2],
}

export function emptyPattern(rows = PADS.length, steps = STEPS) {
  return Array.from({ length: rows }, () => Array(steps).fill(false))
}

export function patternFromPads(pads = PADS, steps = STEPS) {
  return pads.map((pad) => {
    const row = Array(steps).fill(false)
    for (const hit of pad.hits) {
      if (hit >= 0 && hit < steps) row[hit] = true
    }
    return row
  })
}

export function toggleCell(pattern, row, step) {
  pattern[row][step] = !pattern[row][step]
  return pattern[row][step]
}

export function clearPattern(pattern) {
  for (const row of pattern) row.fill(false)
}

export function randomRows(pads = PADS, steps = STEPS, rng = Math.random) {
  return pads.map((pad) => {
    const weights = WEIGHTS[pad.voice] ?? []
    return Array.from({ length: steps }, (_, step) => rng() < (weights[step] ?? 0))
  })
}

export function writePattern(target, source) {
  for (let row = 0; row < target.length; row += 1) {
    for (let step = 0; step < target[row].length; step += 1) {
      target[row][step] = Boolean(source[row]?.[step])
    }
  }
}

export function stepDuration(bpm) {
  return 60 / bpm / 4
}
