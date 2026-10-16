import test from 'node:test'
import assert from 'node:assert/strict'
import { EFFECTS } from '../src/config.js'
import { PADS } from '../src/config.js'
import { createFxRack } from '../src/fx-rack.js'

test('los efectos tienen tecla propia y no pisan los pads', () => {
  const keys = EFFECTS.map((fx) => fx.key)
  assert.equal(new Set(keys).size, keys.length)
  const padKeys = new Set(PADS.map((pad) => pad.key))
  for (const key of keys) assert.equal(padKeys.has(key), false)
  assert.equal(EFFECTS.some((fx) => fx.experimental), true)
})

test('encender, apagar y subir la cantidad', () => {
  const rack = createFxRack(EFFECTS)
  assert.equal(rack.view().effects.every((fx) => fx.on === false), true)

  const on = rack.toggle('wawa')
  assert.equal(on.selected, 'wawa')
  assert.equal(on.effects.find((fx) => fx.id === 'wawa').on, true)

  const off = rack.toggle('wawa')
  assert.equal(off.effects.find((fx) => fx.id === 'wawa').on, false)

  const louder = rack.nudge(0.25)
  const wawa = louder.effects.find((fx) => fx.id === 'wawa')
  assert.equal(wawa.on, true)
  assert.ok(wawa.amount > 0.7)

  const maxed = rack.setAmount(5)
  assert.equal(maxed.effects.find((fx) => fx.id === 'wawa').amount, 1)
  const silenced = rack.setAmount(0)
  assert.equal(silenced.effects.find((fx) => fx.id === 'wawa').on, false)
})
