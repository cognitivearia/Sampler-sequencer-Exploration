import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { PADS, cameraShot, colors, letterSlop } from './config.js'
import { letterCanvas, screenCanvas } from './glyphs.js'

const PITCH = 1.02
const PAD = 0.78
const PAD_H = 0.12
const BODY_W = 5.5
const BODY_H = 0.46
const BODY_D = 4.9
const DECK_H = 0.08
const TRAVEL = 0.072

function toonGradient() {
  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = 1
  const ctx = canvas.getContext('2d')
  ;['#5c5c5c', '#8d8d8d', '#cfcfcf', '#ffffff'].forEach((color, index) => {
    ctx.fillStyle = color
    ctx.fillRect(index, 0, 1, 1)
  })
  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.generateMipmaps = false
  texture.colorSpace = THREE.NoColorSpace
  return texture
}

function nearest(canvas) {
  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.generateMipmaps = false
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function starGeometry(outer, inner) {
  const shape = new THREE.Shape()
  const points = 5
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  const geometry = new THREE.ShapeGeometry(shape)
  geometry.rotateX(-Math.PI / 2)
  return geometry
}

function unit(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

export function createMachine(canvas, { onPad, onHover }) {
  const gradient = toonGradient()
  const inkMat = new THREE.MeshBasicMaterial({ color: colors.ink, side: THREE.BackSide })
  const inkFlat = new THREE.MeshBasicMaterial({ color: colors.ink })
  const paper = new THREE.Color(colors.paper)
  const hot = new THREE.Color(colors.whiteHot)
  const orange = new THREE.Color(colors.orange)
  const ink = new THREE.Color(colors.ink)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(cameraShot.fov, 1, 0.1, 50)
  camera.position.set(...cameraShot.position)
  camera.lookAt(...cameraShot.lookAt)

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NoToneMapping

  scene.add(new THREE.HemisphereLight(colors.cream, colors.purpleDeep, 1.2))
  const key = new THREE.DirectionalLight(0xfff6dc, 2.5)
  key.position.set(-4.5, 9, 6)
  scene.add(key)
  const fill = new THREE.DirectionalLight(colors.orange, 0.4)
  fill.position.set(6, 2.5, -3)
  scene.add(fill)

  const root = new THREE.Group()
  root.rotation.y = -0.18
  scene.add(root)

  function solid(geometry, color, outlineScale = 1.03) {
    const group = new THREE.Group()
    const outline = new THREE.Mesh(geometry, inkMat)
    outline.scale.setScalar(outlineScale)
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshToonMaterial({ color, gradientMap: gradient }),
    )
    group.add(outline, mesh)
    return { group, mesh }
  }

  const body = solid(new RoundedBoxGeometry(BODY_W, BODY_H, BODY_D, 3, 0.1), colors.purpleDeep, 1.018)
  body.group.position.y = BODY_H / 2
  root.add(body.group)

  const deck = solid(
    new RoundedBoxGeometry(BODY_W - 0.28, DECK_H, BODY_D - 0.28, 2, 0.05),
    colors.purple,
    1.02,
  )
  deck.group.position.y = BODY_H + DECK_H / 2
  root.add(deck.group)

  const lip = solid(new RoundedBoxGeometry(BODY_W * 0.94, BODY_H * 0.62, 0.16, 2, 0.04), colors.orange, 1.04)
  lip.group.position.set(0, BODY_H * 0.38, BODY_D / 2 + 0.02)
  root.add(lip.group)

  const deckTop = BODY_H + DECK_H
  const screwGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.05, 12)
  const screwMat = new THREE.MeshToonMaterial({ color: colors.yellow, gradientMap: gradient })
  for (const [sx, sz, turn] of [
    [-1, -1, 0.4],
    [1, -1, 1.1],
    [-1, 1, 0.8],
    [1, 1, 2.2],
  ]) {
    const screw = new THREE.Group()
    screw.position.set(sx * (BODY_W / 2 - 0.36), deckTop + 0.02, sz * (BODY_D / 2 - 0.36))
    const head = new THREE.Mesh(screwGeo, screwMat)
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.014), inkFlat)
    slot.position.y = 0.028
    slot.rotation.y = turn
    screw.add(head, slot)
    root.add(screw)
  }

  const starInk = new THREE.Mesh(starGeometry(0.28, 0.12), inkFlat)
  const star = new THREE.Mesh(
    starGeometry(0.23, 0.09),
    new THREE.MeshBasicMaterial({ color: colors.yellow }),
  )
  starInk.position.set(-2.28, deckTop + 0.012, 1.42)
  star.position.set(-2.28, deckTop + 0.02, 1.42)
  star.rotation.y = 0.35
  starInk.rotation.y = 0.35
  root.add(starInk, star)

  const discGeo = new THREE.CircleGeometry(0.18, 18)
  discGeo.rotateX(-Math.PI / 2)
  const disc = new THREE.Mesh(discGeo, new THREE.MeshBasicMaterial({ color: colors.orange }))
  disc.position.set(2.05, deckTop + 0.016, -2.12)
  root.add(disc)

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(3.2, 40),
    new THREE.MeshBasicMaterial({ color: colors.ink, transparent: true, opacity: 0.22, depthWrite: false }),
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.002
  shadow.scale.set(1.15, 1, 0.95)
  root.add(shadow)

  const bezel = solid(new RoundedBoxGeometry(1.92, 0.07, 0.82, 2, 0.04), colors.ink, 1.015)
  bezel.group.position.set(0, deckTop + 0.04, 1.72)
  root.add(bezel.group)
  const screenMat = new THREE.MeshBasicMaterial({ color: colors.screen })
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.68, 0.64), screenMat)
  screen.rotation.x = -Math.PI / 2
  screen.position.set(0, deckTop + 0.08, 1.72)
  root.add(screen)
  const led = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.04, 0.1),
    new THREE.MeshBasicMaterial({ color: colors.ink }),
  )
  led.position.set(-1.12, deckTop + 0.09, 1.72)
  root.add(led)

  let screenTex = null
  function setBpm(bpm) {
    const image = screenCanvas(bpm)
    if (!screenTex) {
      screenTex = nearest(image)
      screenMat.map = screenTex
      screenMat.needsUpdate = true
    } else {
      screenTex.image = image
      screenTex.needsUpdate = true
    }
  }

  const letterGeo = new THREE.PlaneGeometry(0.68, 0.68)
  letterGeo.rotateX(-Math.PI / 2)
  const capGeo = new RoundedBoxGeometry(PAD, PAD_H, PAD, 2, 0.08)
  const wellGeo = new RoundedBoxGeometry(PAD + 0.12, 0.07, PAD + 0.12, 2, 0.05)
  const wellMat = new THREE.MeshToonMaterial({ color: colors.well, gradientMap: gradient })
  const caps = []
  const pads = []

  PADS.forEach((pad, index) => {
    const col = index % 4
    const row = Math.floor(index / 4)
    const x = (col - 1.5) * PITCH
    const z = (row - 1) * PITCH - 0.28

    const well = new THREE.Mesh(wellGeo, wellMat)
    well.position.set(x, deckTop - 0.01, z)
    root.add(well)

    const mover = new THREE.Group()
    const baseY = deckTop + PAD_H / 2 + 0.055
    mover.position.set(x, baseY, z)

    const material = new THREE.MeshToonMaterial({
      color: colors.paper,
      emissive: colors.orange,
      emissiveIntensity: 0,
      gradientMap: gradient,
    })
    const outline = new THREE.Mesh(capGeo, inkMat)
    outline.scale.setScalar(1.045)
    const cap = new THREE.Mesh(capGeo, material)
    cap.userData.index = index

    const map = nearest(letterCanvas(pad.letter, index + 1, letterSlop))
    const letter = new THREE.Mesh(
      letterGeo,
      new THREE.MeshBasicMaterial({ map, transparent: true, alphaTest: 0.45 }),
    )
    letter.position.y = PAD_H / 2 + 0.01
    letter.position.x = (unit(index + 3) - 0.5) * 0.04
    letter.position.z = (unit(index + 9) - 0.5) * 0.04
    letter.rotation.y = (unit(index + 5) - 0.5) * 0.1

    mover.add(outline, cap, letter)
    root.add(mover)
    caps.push(cap)
    pads.push({ mover, material, baseY, down: 0, glow: 0 })
  })

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()

  function readPointer(event) {
    const rect = canvas.getBoundingClientRect()
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  function padUnderPointer() {
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects(caps, false)
    return hits.length ? hits[0].object.userData.index : null
  }

  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return
    readPointer(event)
    const index = padUnderPointer()
    if (index == null) return
    event.preventDefault()
    onPad(index)
  })
  canvas.addEventListener('pointermove', (event) => {
    readPointer(event)
    const index = padUnderPointer()
    canvas.style.cursor = index == null ? 'default' : 'pointer'
    onHover(index)
  })
  canvas.addEventListener('pointerleave', () => {
    canvas.style.cursor = 'default'
    onHover(null)
  })
  canvas.addEventListener('contextmenu', (event) => event.preventDefault())

  let ledGlow = 0

  function resize() {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (!width || !height) return
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(width, height, false)
    camera.aspect = width / Math.max(1, height)
    camera.updateProjectionMatrix()
  }

  const observer = new ResizeObserver(resize)
  observer.observe(canvas)
  resize()

  return {
    setBpm,
    resize,
    hit(index) {
      const pad = pads[index]
      if (!pad) return
      pad.down = 1
      pad.glow = 1
    },
    pulseLed() {
      ledGlow = 1
    },
    update(dt) {
      for (const pad of pads) {
        pad.down = Math.max(0, pad.down - dt * 6.4)
        pad.glow *= Math.exp(-dt * 3.2)
        if (pad.glow < 0.012) pad.glow = 0
        pad.mover.position.y = pad.baseY - TRAVEL * pad.down
        pad.material.emissiveIntensity = pad.glow * 1.35
        pad.material.color.copy(paper).lerp(hot, Math.min(1, pad.glow * 1.25))
      }
      ledGlow *= Math.exp(-dt * 7)
      if (ledGlow < 0.02) ledGlow = 0
      led.material.color.copy(ink).lerp(orange, ledGlow)
      renderer.render(scene, camera)
    },
    dispose() {
      observer.disconnect()
      renderer.dispose()
    },
  }
}
