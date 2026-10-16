// Parámetros para remixar. Los colores también están en src/style.css
// y en public/poster.svg: si cambias uno, cambia los tres.

export const colors = {
  yellow: '#FFD000',
  paper: '#FFE56A',
  cream: '#FFF6D4',
  orange: '#FF5C1C',
  orangeHot: '#FFB000',
  whiteHot: '#FFF4D2',
  purple: '#6C2BD9',
  purpleDeep: '#3A1280',
  well: '#14061F',
  ink: '#1A0A14',
  screen: '#FFF1A8',
}

export const STEPS = 16
export const DEFAULT_BPM = 126
export const MIN_BPM = 70
export const MAX_BPM = 180

// Cámara fija. No hay órbita: es un objeto visto desde un solo lado.
export const cameraShot = {
  fov: 32,
  position: [0.35, 5.15, 7.55],
  lookAt: [0, 0.02, -0.12],
}

// Cuánto se "descuidan" las letras de los pads.
// shift: cuántos píxeles de la letra se corre la tinta naranja.
// holes: píxeles que faltan. tilt: giro máximo, en radianes.
export const letterSlop = {
  shift: 1,
  holes: 2,
  extras: 4,
  tilt: 0.09,
}

// Orden de lectura, de izquierda a derecha y de arriba a abajo.
// `key` es la tecla del teclado (la posición), no la letra pintada.
// Hay letras repetidas, así que la tecla no puede ser la letra.
export const PADS = [
  { letter: 'S', key: 'Q', name: 'Bombo', voice: 'kick', hits: [0, 3, 6, 8, 11] },
  { letter: 'Q', key: 'W', name: 'Caja', voice: 'snare', hits: [4, 12] },
  { letter: 'U', key: 'E', name: 'Charles', voice: 'hat', hits: [0, 2, 4, 6, 8, 10, 12, 14] },
  { letter: 'A', key: 'R', name: 'Abierto', voice: 'openhat', hits: [10] },
  { letter: 'R', key: 'A', name: 'Palmada', voice: 'clap', hits: [4, 12] },
  { letter: 'E', key: 'S', name: 'Tom grave', voice: 'tomLow', hits: [14, 15] },
  { letter: 'P', key: 'D', name: 'Tom medio', voice: 'tomMid', hits: [] },
  { letter: 'U', key: 'F', name: 'Aro', voice: 'rim', hits: [6] },
  { letter: 'S', key: 'Z', name: 'Shaker', voice: 'shaker', hits: [1, 5, 9, 13] },
  { letter: 'H', key: 'X', name: 'Cencerro', voice: 'cowbell', hits: [] },
  { letter: 'E', key: 'C', name: 'Crash', voice: 'crash', hits: [] },
  { letter: 'R', key: 'V', name: 'Golpe', voice: 'perc', hits: [7] },
]
