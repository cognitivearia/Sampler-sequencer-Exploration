import { createAudio } from './audio.js'
import { createMachine } from './machine.js'
import { createPanel } from './panel.js'
import { createSequencer } from './sequencer.js'
import { DEFAULT_BPM, PADS } from './config.js'
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
  },
  onSwing: (value) => sequencer.setSwing(value),
  onVolume: (value) => audio.setVolume(value),
})

machine.setBpm(DEFAULT_BPM)

const keys = new Map(PADS.map((pad, index) => [pad.key.toLowerCase(), index]))

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
