import { createAudio } from './audio.js'
import { createMachine } from './machine.js'
import { createPanel } from './panel.js'
import { createSequencer } from './sequencer.js'
import { DEFAULT_BPM, EFFECTS, PADS } from './config.js'
import { createFxRack } from './fx-rack.js'
import { patternFromPads } from './pattern.js'

const audio = createAudio()
const pattern = patternFromPads()
const canvas = document.querySelector('#view')
const stage = document.querySelector('#stage')

const machine = createMachine(canvas, {
  onPad: (index) => perform(index),
  onHover: (index) => panel.showPad(index),
})

const sequencer = createSequencer({ pads: PADS, pattern, audio })
const fx = createFxRack(EFFECTS)

function pushEffect(id) {
  const current = fx.view().effects.find((item) => item.id === id)
  if (!current) return
  audio.setEffect(id, current)
}

const panel = createPanel(document.querySelector('#panel'), {
  pads: PADS,
  pattern,
  bpm: DEFAULT_BPM,
  onPad: (index) => perform(index),
  onToggle: () => togglePlay(),
  onRecord: () => toggleRecord(),
  onClear: () => {
    sequencer.clear()
    panel.syncPattern()
  },
  onRandom: () => {
    sequencer.randomize()
    panel.syncPattern()
  },
  onBpm: (value) => {
    sequencer.setBpm(value)
    machine.setBpm(value)
    audio.setTempo(value)
  },
  onSwing: (value) => sequencer.setSwing(value),
  onVolume: (value) => audio.setVolume(value),
  effects: fx.view(),
  onToggleEffect: async (id) => {
    await audio.unlock()
    const view = fx.toggle(id)
    pushEffect(id)
    panel.paintFx(view)
  },
  onEffectAmount: async (amount) => {
    await audio.unlock()
    const view = fx.setAmount(amount)
    pushEffect(view.selected)
    panel.paintFx(view)
  },
})

machine.setBpm(DEFAULT_BPM)

const keys = new Map(PADS.map((pad, index) => [pad.key.toLowerCase(), index]))
const effectKeys = new Map(EFFECTS.map((item) => [item.key, item.id]))

async function perform(index) {
  await audio.unlock()
  audio.play(PADS[index].voice)
  machine.hit(index)
  panel.showPad(index)
  if (sequencer.write(index)) panel.syncPattern()
}

async function togglePlay() {
  const playing = await sequencer.toggle()
  panel.setPlaying(playing)
  if (!playing) panel.setPlayhead(-1)
}

async function toggleRecord() {
  const recording = await sequencer.toggleRecord()
  panel.setRecording(recording)
  panel.setPlaying(sequencer.playing)
}

window.addEventListener('keydown', (event) => {
  const tag = event.target?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
  if (event.code === 'Space') {
    event.preventDefault()
    if (!event.repeat) togglePlay()
    return
  }
  if (event.metaKey || event.ctrlKey || event.altKey) return
  const effectId = effectKeys.get(event.key)
  if (effectId) {
    event.preventDefault()
    if (!event.repeat) {
      audio.unlock().then(() => {
        const view = fx.toggle(effectId)
        pushEffect(effectId)
        panel.paintFx(view)
      })
    }
    return
  }
  if (event.key === '-' || event.key === '_' || event.key === '+' || event.key === '=') {
    event.preventDefault()
    const delta = event.key === '-' || event.key === '_' ? -0.08 : 0.08
    audio.unlock().then(() => {
      const view = fx.nudge(delta)
      pushEffect(view.selected)
      panel.paintFx(view)
    })
    return
  }
  const index = keys.get(event.key.toLowerCase())
  if (index == null) return
  event.preventDefault()
  perform(index)
})

let last = performance.now()
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  if (sequencer.playing) {
    const due = sequencer.poll(audio.now())
    if (due.length) {
      const heard = due.at(-1)
      panel.setPlayhead(heard.step)
      machine.pulseLed()
      const fresh = due.filter((event) => audio.now() - event.time < 0.08)
      const shown = fresh.length ? fresh : [heard]
      for (const event of shown) {
        for (const index of event.hits) machine.hit(index)
      }
    }
  }
  machine.update(dt)
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)

window.addEventListener('error', (event) => {
  const note = document.createElement('p')
  note.className = 'crash'
  note.textContent = 'La caja se detuvo. Recarga la página.'
  stage.append(note)
  console.error(event.error || event.message)
})
