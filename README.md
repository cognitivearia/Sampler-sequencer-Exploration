# Caja de ritmo

Un objeto 3D fijo: 12 pads en tres filas, las letras de **SQUAREPUSHER**, y un secuenciador de 16 pasos. Los pads se hunden y se iluminan. El cartel de fondo usa amarillo, morado y naranja.

La cámara no gira. El sonido se sintetiza en el navegador: no hay que descargar samples.

## Abrir

```bash
npm install
npm run dev
```

Entra en la dirección que muestra la terminal (normalmente `http://localhost:5173`).

## Tocar

- Clic en un pad, o el teclado: `Q W E R` / `A S D F` / `Z X C V`.
- La letra grande es el dibujo. La tecla pequeña es la posición, porque hay letras repetidas.
- Espacio: suena o se para el patrón.
- En la rejilla, cada fila es un pad y cada columna un paso. Clic enciende o apaga ese golpe.
- **Grabar**: mientras suena, lo que toques se anota en el paso actual.
- **Aleatorio** propone otro ritmo. **Borrar** deja la rejilla en blanco.
- Tempo, balanceo (swing) y volumen están en los deslizadores.

## Qué cambiar

| Quiero… | Archivo |
| --- | --- |
| Colores, tempo inicial, letras, golpes del patrón | `src/config.js` |
| El dibujo de cada letra | `src/glyphs.js` |
| Cómo suena cada pad | `src/audio.js` |
| El cartel de fondo | `public/poster.svg` |
| Tamaño de la caja y cuánto se hunde un pad | `src/machine.js` (`TRAVEL`, `PITCH`, `PAD`) |

`letterSlop` en `src/config.js` controla lo descuidadas que se ven las letras: `shift` corre la tinta naranja, `holes` quita píxeles, `tilt` las gira.

## Probar la lógica del patrón

```bash
npm test
```
