import test from 'node:test'
import assert from 'node:assert/strict'
import { PADS, STEPS } from '../src/config.js'
import {
  clearPattern,
  patternFromPads,
  randomRows,
  toggleCell,
  writePattern,
} from '../src/pattern.js'

test('los 12 pads deletrean SQUAREPUSHER', () => {
  assert.equal(PADS.map((pad) => pad.letter).join(''), 'SQUAREPUSHER')
  assert.equal(PADS.length, 12)
})

test('cada pad tiene una tecla distinta', () => {
  assert.equal(new Set(PADS.map((pad) => pad.key)).size, PADS.length)
})

test('el patrón inicial respeta los golpes y mide 12×16', () => {
  const pattern = patternFromPads()
  assert.equal(pattern.length, 12)
  assert.equal(pattern[0].length, STEPS)
  assert.equal(pattern[0][0], true)
  assert.equal(pattern[1][4], true)
  assert.equal(pattern[1][0], false)
})

test('encender y apagar un paso, y borrar el patrón', () => {
  const pattern = patternFromPads()
  assert.equal(toggleCell(pattern, 6, 3), true)
  assert.equal(pattern[6][3], true)
  assert.equal(toggleCell(pattern, 6, 3), false)
  clearPattern(pattern)
  assert.equal(pattern.some((row) => row.some(Boolean)), false)
})

test('aleatorio es estable si el dado es el mismo', () => {
  let seed = 3
  const rng = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  const again = () => {
    seed = 3
    return rng
  }
  again()
  const first = randomRows(PADS, STEPS, rng)
  again()
  const second = randomRows(PADS, STEPS, rng)
  assert.deepEqual(first, second)
  assert.equal(first.length, 12)
  assert.equal(first[0].length, 16)
  assert.equal(first.every((row) => row.every((cell) => typeof cell === 'boolean')), true)
})

test('un dado que siempre saca 0 enciende los pesos altos del bombo', () => {
  const pattern = randomRows(PADS, STEPS, () => 0)
  assert.equal(pattern[0][0], true)
  assert.equal(pattern[0][8], true)
  const quiet = randomRows(PADS, STEPS, () => 0.99)
  assert.equal(quiet[0][0], true)
  assert.equal(quiet[0][1], false)
})

test('copiar un patrón no cambia el tamaño', () => {
  const target = patternFromPads()
  const source = randomRows()
  writePattern(target, source)
  assert.deepEqual(target, source)
})
