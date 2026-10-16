// Sintetizador de batería. Cada nombre de `voice` en config.js
// corresponde a una función de aquí. No usa samples.

export function createAudio() {
  let ctx = null
  let master = null
  let noise = null

  function ensure() {
    if (ctx) return
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    ctx = new AudioCtx()
    master = ctx.createGain()
    master.gain.value = 0.78
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -16
    comp.knee.value = 14
    comp.ratio.value = 4
    comp.attack.value = 0.004
    comp.release.value = 0.16
    master.connect(comp)
    comp.connect(ctx.destination)

    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1
  }

  function env(peak, time, attack, release) {
    const gain = ctx.createGain()
    gain.connect(master)
    const safe = Math.max(0.0001, peak)
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(safe, time + attack)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + attack + release)
    return gain
  }

  function tone(type, freq, time, peak, attack, release, glide) {
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(freq, time)
    if (glide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, glide), time + release * 0.7)
    const gain = env(peak, time, attack, release)
    osc.connect(gain)
    osc.start(time)
    osc.stop(time + attack + release + 0.02)
    osc.onended = () => {
      osc.disconnect()
      gain.disconnect()
    }
  }

  function noiseHit(time, { dur, peak, hp, bp, q = 0.8 }) {
    const src = ctx.createBufferSource()
    src.buffer = noise
    let node = src
    if (hp) {
      const filter = ctx.createBiquadFilter()
      filter.type = 'highpass'
      filter.frequency.setValueAtTime(hp, time)
      node.connect(filter)
      node = filter
    }
    if (bp) {
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(bp, time)
      filter.Q.setValueAtTime(q, time)
      node.connect(filter)
      node = filter
    }
    const gain = env(peak, time, 0.003, dur)
    node.connect(gain)
    const offset = Math.random() * Math.max(0.01, noise.duration - dur - 0.05)
    src.start(time, offset, dur + 0.03)
    src.stop(time + dur + 0.04)
    src.onended = () => {
      src.disconnect()
      gain.disconnect()
    }
  }

  const voices = {
    kick(time) {
      tone('sine', 168, time, 0.95, 0.004, 0.28, 46)
      tone('square', 980, time, 0.12, 0.001, 0.012, 180)
    },
    snare(time) {
      tone('triangle', 196, time, 0.28, 0.003, 0.12, 140)
      noiseHit(time, { dur: 0.16, peak: 0.42, bp: 1800, q: 0.7 })
    },
    hat(time) {
      noiseHit(time, { dur: 0.04, peak: 0.2, hp: 7000 })
    },
    openhat(time) {
      noiseHit(time, { dur: 0.26, peak: 0.16, hp: 5500 })
    },
    clap(time) {
      noiseHit(time, { dur: 0.018, peak: 0.32, bp: 1600, q: 0.7 })
      noiseHit(time + 0.012, { dur: 0.018, peak: 0.26, bp: 1500, q: 0.7 })
      noiseHit(time + 0.026, { dur: 0.14, peak: 0.22, bp: 1100, q: 0.5 })
    },
    tomLow(time) {
      tone('sine', 150, time, 0.55, 0.004, 0.26, 78)
    },
    tomMid(time) {
      tone('sine', 220, time, 0.48, 0.004, 0.2, 120)
    },
    rim(time) {
      tone('triangle', 480, time, 0.22, 0.001, 0.04, 220)
      noiseHit(time, { dur: 0.02, peak: 0.16, hp: 2000 })
    },
    shaker(time) {
      noiseHit(time, { dur: 0.035, peak: 0.14, hp: 5000 })
      noiseHit(time + 0.028, { dur: 0.03, peak: 0.08, hp: 6000 })
    },
    cowbell(time) {
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(900, time)
      filter.Q.setValueAtTime(4, time)
      const gain = env(0.28, time, 0.003, 0.16)
      filter.connect(gain)
      const oscillators = [587, 845].map((freq) => {
        const osc = ctx.createOscillator()
        osc.type = 'square'
        osc.frequency.setValueAtTime(freq, time)
        osc.connect(filter)
        osc.start(time)
        osc.stop(time + 0.2)
        return osc
      })
      oscillators[1].onended = () => {
        oscillators.forEach((osc) => osc.disconnect())
        filter.disconnect()
        gain.disconnect()
      }
    },
    crash(time) {
      noiseHit(time, { dur: 0.7, peak: 0.18, hp: 3200, bp: 4500, q: 0.35 })
    },
    perc(time) {
      tone('square', 320, time, 0.16, 0.002, 0.07, 90)
      noiseHit(time, { dur: 0.05, peak: 0.12, bp: 900, q: 1.2 })
    },
  }

  return {
    async unlock() {
      ensure()
      if (ctx.state !== 'running') await ctx.resume()
    },
    now() {
      ensure()
      return ctx.currentTime
    },
    setVolume(value) {
      ensure()
      const next = Math.min(1, Math.max(0, value))
      master.gain.setTargetAtTime(next, ctx.currentTime, 0.015)
    },
    play(voice, time) {
      ensure()
      const when = time ?? ctx.currentTime
      voices[voice]?.(when)
    },
  }
}
