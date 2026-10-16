import { MAX_BPM, MIN_BPM, STEPS } from './config.js'

function button(label, className, onClick) {
  const el = document.createElement('button')
  el.type = 'button'
  el.className = className
  el.textContent = label
  el.addEventListener('click', () => {
    el.blur()
    onClick()
  })
  return el
}

function slider({ label, min, max, step, value, format, onInput }) {
  const wrap = document.createElement('label')
  wrap.className = 'slider'
  const title = document.createElement('span')
  const input = document.createElement('input')
  input.type = 'range'
  input.min = String(min)
  input.max = String(max)
  input.step = String(step)
  input.value = String(value)
  input.setAttribute('aria-label', label)
  const paint = () => {
    title.textContent = `${label} ${format(Number(input.value))}`
  }
  input.addEventListener('input', () => {
    paint()
    onInput(Number(input.value))
  })
  paint()
  wrap.append(title, input)
  return wrap
}

function effectButton(fx, onToggle) {
  const el = document.createElement('button')
  el.type = 'button'
  el.className = 'fx-btn'
  el.dataset.effect = fx.id
  el.title = fx.hint
  el.setAttribute('aria-pressed', 'false')
  el.setAttribute('aria-label', `${fx.name}. Tecla ${fx.key}. ${fx.hint}`)
  const key = document.createElement('kbd')
  key.textContent = fx.key
  const label = document.createElement('span')
  label.textContent = fx.name
  el.append(key, label)
  if (fx.experimental) {
    const tag = document.createElement('i')
    tag.textContent = 'exp'
    el.append(tag)
  }
  el.addEventListener('click', () => {
    el.blur()
    onToggle(fx.id)
  })
  return el
}

export function createPanel(root, { pads, pattern, bpm, effects, onToggle, onRecord, onClear, onRandom, onBpm, onSwing, onVolume, onPad, onToggleEffect, onEffectAmount }) {
  root.replaceChildren()

  const transport = document.createElement('div')
  transport.className = 'transport'

  const playBtn = button('Tocar', 'pad-btn', onToggle)
  const recBtn = button('Grabar', 'pad-btn', onRecord)
  const clearBtn = button('Borrar', 'pad-btn pad-btn-ink', onClear)
  const randomBtn = button('Aleatorio', 'pad-btn pad-btn-ink', onRandom)
  playBtn.setAttribute('aria-pressed', 'false')
  recBtn.setAttribute('aria-pressed', 'false')

  const name = document.createElement('p')
  name.className = 'now'
  name.textContent = 'Elige un pad'

  const tempo = slider({
    label: 'Tempo',
    min: MIN_BPM,
    max: MAX_BPM,
    step: 1,
    value: bpm,
    format: (value) => String(Math.round(value)),
    onInput: onBpm,
  })
  const swing = slider({
    label: 'Balanceo',
    min: 0,
    max: 50,
    step: 1,
    value: 0,
    format: (value) => `${Math.round(value)}%`,
    onInput: (value) => onSwing(value / 100),
  })
  swing.title = 'Retrasa los pasos impares para que el ritmo se balancee.'
  const volume = slider({
    label: 'Volumen',
    min: 0,
    max: 100,
    step: 1,
    value: 78,
    format: (value) => String(Math.round(value)),
    onInput: (value) => onVolume(value / 100),
  })

  transport.append(playBtn, recBtn, clearBtn, randomBtn, tempo, swing, volume, name)

  const fxBar = document.createElement('div')
  fxBar.className = 'fx'
  const fxLabel = document.createElement('span')
  fxLabel.className = 'fx-label'
  fxLabel.textContent = 'Efectos'
  const fxList = document.createElement('div')
  fxList.className = 'fx-list'
  fxList.setAttribute('role', 'toolbar')
  fxList.setAttribute('aria-label', 'Efectos')
  const fxButtons = new Map()
  for (const fx of effects.effects) {
    const el = effectButton(fx, onToggleEffect)
    fxButtons.set(fx.id, el)
    fxList.append(el)
  }
  const amountTitle = document.createElement('span')
  const amountInput = document.createElement('input')
  amountInput.type = 'range'
  amountInput.min = '0'
  amountInput.max = '100'
  amountInput.step = '1'
  amountInput.setAttribute('aria-label', 'Cantidad del efecto')
  const amountWrap = document.createElement('label')
  amountWrap.className = 'slider fx-amount'
  amountInput.addEventListener('input', () => {
    onEffectAmount(Number(amountInput.value) / 100)
  })
  amountWrap.append(amountTitle, amountInput)
  fxBar.append(fxLabel, fxList, amountWrap)

  const grid = document.createElement('div')
  grid.className = 'grid'
  grid.style.setProperty('--steps', String(STEPS))
  grid.setAttribute('role', 'grid')
  grid.setAttribute('aria-label', 'Secuenciador de 16 pasos')

  const corner = document.createElement('div')
  corner.className = 'corner'
  corner.textContent = 'Pads'
  grid.append(corner)

  for (let step = 0; step < STEPS; step += 1) {
    const head = document.createElement('div')
    head.className = step % 4 === 0 ? 'step-no is-downbeat' : 'step-no'
    head.dataset.step = String(step)
    head.textContent = String(step + 1)
    grid.append(head)
  }

  const stepButtons = []
  pads.forEach((pad, row) => {
    const lane = document.createElement('div')
    lane.className = 'lane'
    const laneBtn = document.createElement('button')
    laneBtn.type = 'button'
    laneBtn.className = 'lane-btn'
    laneBtn.dataset.pad = String(row)
    const key = document.createElement('kbd')
    key.textContent = pad.key
    const letter = document.createElement('b')
    letter.textContent = pad.letter
    laneBtn.append(key, letter)
    laneBtn.title = `${pad.name}. Tecla ${pad.key}`
    laneBtn.addEventListener('click', () => {
      laneBtn.blur()
      onPad(row)
    })
    lane.append(laneBtn)
    grid.append(lane)

    for (let step = 0; step < STEPS; step += 1) {
      const cell = document.createElement('button')
      cell.type = 'button'
      cell.className = 'step'
      cell.dataset.row = String(row)
      cell.dataset.step = String(step)
      cell.setAttribute('aria-pressed', pattern[row][step] ? 'true' : 'false')
      cell.setAttribute('aria-label', `${pad.name}, paso ${step + 1}`)
      if (pattern[row][step]) cell.classList.add('is-on')
      cell.addEventListener('click', () => {
        cell.blur()
        const on = !pattern[row][step]
        pattern[row][step] = on
        cell.classList.toggle('is-on', on)
        cell.setAttribute('aria-pressed', on ? 'true' : 'false')
      })
      grid.append(cell)
      stepButtons.push(cell)
    }
  })

  const hint = document.createElement('p')
  hint.className = 'hint'
  hint.textContent = 'Pads: Q W E R · A S D F · Z X C V. Espacio toca o para. Efectos: 1 a 7. − y + cambian la cantidad.'

  root.append(transport, fxBar, grid, hint)

  function paintFx(view) {
    for (const fx of view.effects) {
      const el = fxButtons.get(fx.id)
      if (!el) continue
      el.classList.toggle('is-on', fx.on)
      el.classList.toggle('is-selected', fx.id === view.selected)
      el.setAttribute('aria-pressed', fx.on ? 'true' : 'false')
      if (fx.id === view.selected) el.scrollIntoView({ inline: 'nearest', block: 'nearest' })
    }
    const current = view.effects.find((fx) => fx.id === view.selected)
    if (!current) return
    const percent = Math.round(current.amount * 100)
    if (document.activeElement !== amountInput) amountInput.value = String(percent)
    amountTitle.textContent = `${current.name} ${percent}%`
    amountInput.setAttribute('aria-label', `Cantidad de ${current.name}`)
  }
  paintFx(effects)

  function syncPattern() {
    for (const cell of stepButtons) {
      const row = Number(cell.dataset.row)
      const step = Number(cell.dataset.step)
      const on = pattern[row][step]
      cell.classList.toggle('is-on', on)
      cell.setAttribute('aria-pressed', on ? 'true' : 'false')
    }
  }

  return {
    syncPattern,
    setPlaying(on) {
      playBtn.textContent = on ? 'Parar' : 'Tocar'
      playBtn.classList.toggle('is-accent', on)
      playBtn.setAttribute('aria-pressed', on ? 'true' : 'false')
    },
    setRecording(on) {
      recBtn.textContent = on ? 'Grabando' : 'Grabar'
      recBtn.classList.toggle('is-hot', on)
      recBtn.setAttribute('aria-pressed', on ? 'true' : 'false')
    },
    setPlayhead(step) {
      root.querySelectorAll('.is-playhead').forEach((el) => el.classList.remove('is-playhead'))
      if (step < 0) return
      root.querySelectorAll(`[data-step="${step}"]`).forEach((el) => el.classList.add('is-playhead'))
    },
    showPad(index) {
      if (index == null || !pads[index]) return
      name.textContent = pads[index].name
      root.querySelectorAll('.lane').forEach((el, lane) => {
        el.classList.toggle('is-hot', lane === index)
      })
    },
    paintFx,
  }
}
