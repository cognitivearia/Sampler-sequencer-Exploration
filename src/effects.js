// Efectos sobre el bus de la batería. El seco siempre se oye;
// cada efecto es un envío que se enciende con su cantidad.

function quantizeCurve(steps) {
  const size = 256
  const curve = new Float32Array(size)
  const safe = Math.max(2, steps)
  for (let i = 0; i < size; i += 1) {
    const x = (i / (size - 1)) * 2 - 1
    curve[i] = Math.round(x * safe) / safe
  }
  return curve
}

function makeSend(ctx, input, output) {
  const wet = ctx.createGain()
  wet.gain.value = 0
  wet.connect(output)
  return {
    wet,
    from(node) {
      input.connect(node)
      return node
    },
    setMix(on, amount, scale = 0.75) {
      const now = ctx.currentTime
      const level = on ? Math.min(1, Math.max(0, amount)) * scale : 0
      wet.gain.setTargetAtTime(level, now, 0.02)
    },
  }
}

export function createEffects(ctx, input, output) {
  const now = () => ctx.currentTime

  const whammy = makeSend(ctx, input, output)
  const whammyDelay = ctx.createDelay(0.2)
  const whammyFilter = ctx.createBiquadFilter()
  whammyFilter.type = 'lowpass'
  whammyFilter.frequency.value = 4800
  const whammyLfo = ctx.createOscillator()
  const whammyDepth = ctx.createGain()
  whammyLfo.type = 'sawtooth'
  whammyLfo.frequency.value = 8
  whammyDelay.delayTime.value = 0.04
  whammy.from(whammyDelay)
  whammyDelay.connect(whammyFilter)
  whammyFilter.connect(whammy.wet)
  whammyLfo.connect(whammyDepth)
  whammyDepth.connect(whammyDelay.delayTime)
  whammyLfo.start()

  const ruido = makeSend(ctx, input, output)
  const crush = ctx.createWaveShaper()
  crush.curve = quantizeCurve(8)
  crush.oversample = '4x'
  ruido.from(crush)
  crush.connect(ruido.wet)

  const wawa = makeSend(ctx, input, output)
  const wah = ctx.createBiquadFilter()
  wah.type = 'bandpass'
  wah.frequency.value = 900
  wah.Q.value = 8
  const wahLfo = ctx.createOscillator()
  const wahDepth = ctx.createGain()
  wahLfo.type = 'sine'
  wahLfo.frequency.value = 2.4
  wahDepth.gain.value = 500
  wahLfo.connect(wahDepth)
  wahDepth.connect(wah.frequency)
  wahLfo.start()
  wawa.from(wah)
  wah.connect(wawa.wet)

  function loopingDelay(maxTime) {
    const send = makeSend(ctx, input, output)
    const delay = ctx.createDelay(maxTime)
    const feedback = ctx.createGain()
    const lowpass = ctx.createBiquadFilter()
    const highpass = ctx.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = 3200
    highpass.type = 'highpass'
    highpass.frequency.value = 160
    feedback.gain.value = 0.3
    send.from(delay)
    delay.connect(lowpass)
    lowpass.connect(highpass)
    highpass.connect(feedback)
    feedback.connect(delay)
    highpass.connect(send.wet)
    return { send, delay, feedback }
  }

  const delay = loopingDelay(1)
  const eco = loopingDelay(1.6)

  const anillo = makeSend(ctx, input, output)
  const ring = ctx.createGain()
  ring.gain.value = 0
  const carrier = ctx.createOscillator()
  const carrierDepth = ctx.createGain()
  carrier.type = 'sine'
  carrier.frequency.value = 180
  carrierDepth.gain.value = 1
  carrier.connect(carrierDepth)
  carrierDepth.connect(ring.gain)
  carrier.start()
  anillo.from(ring)
  ring.connect(anillo.wet)

  const metal = makeSend(ctx, input, output)
  const comb = ctx.createDelay(0.08)
  const combFb = ctx.createGain()
  const combTone = ctx.createBiquadFilter()
  comb.delayTime.value = 0.012
  combFb.gain.value = 0.4
  combTone.type = 'bandpass'
  combTone.frequency.value = 1400
  combTone.Q.value = 2
  metal.from(comb)
  comb.connect(combTone)
  combTone.connect(combFb)
  combFb.connect(comb)
  combTone.connect(metal.wet)

  let bpm = 126

  function seconds(beats) {
    return Math.min(1.45, Math.max(0.05, (60 / bpm) * beats))
  }

  function syncTime() {
    delay.delay.delayTime.setTargetAtTime(seconds(0.5), now(), 0.03)
    eco.delay.delayTime.setTargetAtTime(seconds(1.5), now(), 0.03)
  }
  syncTime()

  function setWhammy(amount) {
    const semitones = -2 - amount * 10
    const ratio = 2 ** (semitones / 12)
    const rate = 8
    const depth = Math.min(0.09, Math.max(0.001, (1 - ratio) / (2 * rate)))
    whammyLfo.frequency.setTargetAtTime(rate, now(), 0.02)
    whammyDepth.gain.setTargetAtTime(depth, now(), 0.02)
    whammyDelay.delayTime.setTargetAtTime(depth + 0.004, now(), 0.02)
  }

  const apply = {
    whammy(on, amount) {
      setWhammy(amount)
      whammy.setMix(on, amount, 0.85)
    },
    ruido(on, amount) {
      const steps = Math.max(2, Math.round(16 - amount * 13))
      crush.curve = quantizeCurve(steps)
      ruido.setMix(on, amount, 0.8)
    },
    wawa(on, amount) {
      wah.Q.setTargetAtTime(3 + amount * 11, now(), 0.03)
      wahLfo.frequency.setTargetAtTime(0.7 + amount * 6, now(), 0.03)
      wahDepth.gain.setTargetAtTime(160 + amount * 980, now(), 0.03)
      wawa.setMix(on, amount, 0.7)
    },
    delay(on, amount) {
      delay.feedback.gain.setTargetAtTime(0.12 + amount * 0.38, now(), 0.03)
      delay.send.setMix(on, amount, 0.7)
    },
    eco(on, amount) {
      eco.feedback.gain.setTargetAtTime(Math.min(0.72, 0.25 + amount * 0.42), now(), 0.03)
      eco.send.setMix(on, amount, 0.62)
    },
    anillo(on, amount) {
      carrier.frequency.setTargetAtTime(50 + amount * 700, now(), 0.03)
      anillo.setMix(on, amount, 0.55)
    },
    metal(on, amount) {
      comb.delayTime.setTargetAtTime(0.02 - amount * 0.012, now(), 0.03)
      combFb.gain.setTargetAtTime(Math.min(0.75, 0.22 + amount * 0.48), now(), 0.03)
      metal.setMix(on, amount, 0.55)
    },
  }

  return {
    setTempo(next) {
      bpm = Math.max(40, next)
      syncTime()
    },
    set(id, { on, amount }) {
      apply[id]?.(on, amount)
    },
  }
}
