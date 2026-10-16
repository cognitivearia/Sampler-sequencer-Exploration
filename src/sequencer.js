import { DEFAULT_BPM, STEPS } from './config.js'
import { clearPattern, randomRows, stepDuration, writePattern } from './pattern.js'

// Reloj del patrón. Programa el audio un poco antes de que suene
// para que el navegador no llegue tarde, y la imagen espera a oírlo.
export function createSequencer({ pads, pattern, audio }) {
  let playing = false
  let recording = false
  let bpm = DEFAULT_BPM
  let swing = 0
  let heardStep = -1
  let nextTime = 0
  let step = 0
  let timer = 0
  const queue = []

  function scheduleAhead(now) {
    const horizon = now + 0.12
    while (nextTime < horizon) {
      const dur = stepDuration(bpm)
      const when = nextTime + (step % 2 === 1 ? dur * swing : 0)
      const hits = []
      for (let index = 0; index < pads.length; index += 1) {
        if (pattern[index][step]) hits.push(index)
      }
      queue.push({ time: when, step, hits })
      for (const index of hits) audio.play(pads[index].voice, when)
      nextTime += dur
      step = (step + 1) % STEPS
    }
  }

  function tick() {
    if (!playing) return
    scheduleAhead(audio.now())
    timer = window.setTimeout(tick, 25)
  }

  async function play() {
    await audio.unlock()
    if (playing) return
    playing = true
    step = 0
    heardStep = -1
    queue.length = 0
    nextTime = audio.now() + 0.05
    tick()
  }

  function stop() {
    playing = false
    window.clearTimeout(timer)
    queue.length = 0
    heardStep = -1
  }

  return {
    pattern,
    get playing() {
      return playing
    },
    get recording() {
      return recording
    },
    get bpm() {
      return bpm
    },
    get swing() {
      return swing
    },
    get heardStep() {
      return heardStep
    },
    play,
    stop,
    async toggle() {
      if (playing) stop()
      else await play()
      return playing
    },
    async toggleRecord() {
      recording = !recording
      if (recording && !playing) await play()
      return recording
    },
    setBpm(value) {
      bpm = value
    },
    setSwing(value) {
      swing = value
    },
    write(index) {
      if (!recording || !playing || heardStep < 0) return false
      pattern[index][heardStep] = true
      return true
    },
    clear() {
      clearPattern(pattern)
    },
    randomize() {
      writePattern(pattern, randomRows(pads, STEPS))
    },
    poll(now) {
      const due = []
      while (queue.length && queue[0].time <= now) due.push(queue.shift())
      if (due.length) heardStep = due.at(-1).step
      return due
    },
  }
}
