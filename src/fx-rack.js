// Estado de los efectos, sin audio. Así se puede probar el encendido
// y la cantidad sin abrir el navegador.

function clamp(value) {
  return Math.min(1, Math.max(0, value))
}

export function createFxRack(definitions) {
  const items = definitions.map((fx) => ({
    id: fx.id,
    name: fx.name,
    key: fx.key,
    hint: fx.hint,
    experimental: Boolean(fx.experimental),
    defaultAmount: fx.amount,
    on: false,
    amount: fx.amount,
  }))
  const byId = Object.fromEntries(items.map((fx) => [fx.id, fx]))
  let selected = items[0]?.id ?? null

  function view() {
    return {
      selected,
      effects: items.map((fx) => ({
        id: fx.id,
        name: fx.name,
        key: fx.key,
        hint: fx.hint,
        experimental: fx.experimental,
        on: fx.on,
        amount: fx.amount,
      })),
    }
  }

  function toggle(id) {
    const fx = byId[id]
    if (!fx) return view()
    selected = id
    if (fx.on) {
      fx.on = false
    } else {
      fx.on = true
      if (fx.amount < 0.08) fx.amount = fx.defaultAmount
    }
    return view()
  }

  function setAmount(amount) {
    const fx = byId[selected]
    if (!fx) return view()
    fx.amount = clamp(amount)
    fx.on = fx.amount > 0.001
    return view()
  }

  function nudge(delta) {
    const fx = byId[selected]
    if (!fx) return view()
    return setAmount(fx.amount + delta)
  }

  return { view, toggle, setAmount, nudge }
}
