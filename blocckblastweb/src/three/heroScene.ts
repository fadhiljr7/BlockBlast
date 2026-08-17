import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { BLOCKS } from '../data/site'
import { patternInk } from '../lib/patterns'

/**
 * The hero scene: a handful of piece silhouettes built out of rounded blocks,
 * drifting in space. Each block carries the same fill-plus-pattern identity it
 * has on the board, painted into a canvas texture, so the 3D blocks are
 * readable as the same objects and not just coloured cubes.
 */

export type HeroScene = {
  /** 0 at the top of the hero, 1 when it has scrolled away. */
  setScrollProgress(progress: number): void
  setPointer(x: number, y: number): void
  dispose(): void
}

type Options = { reducedMotion: boolean }

/** Silhouettes drawn from the app's library, kept small so the formation reads. */
const CLUSTERS: { rows: string[]; block: number; position: [number, number, number] }[] = [
  { rows: ['XXX', 'X..'], block: 0, position: [-3.5, 1.3, -1.2] },
  { rows: ['XX', 'XX'], block: 1, position: [3.3, 1.9, -2.4] },
  { rows: ['.X', 'XX', 'X.'], block: 2, position: [3.9, -1.6, -0.4] },
  { rows: ['XXX'], block: 3, position: [-3.9, -1.9, -2.8] },
  { rows: ['X.', 'XX'], block: 4, position: [0.2, 2.6, -4.2] },
  { rows: ['X'], block: 5, position: [-1.6, -2.7, -1.6] },
  { rows: ['XX'], block: 6, position: [1.9, -2.9, -3.4] },
]

/** Paints one block face: the fill, its pattern, and a soft top highlight. */
function faceTexture(hex: string, pattern: string): THREE.CanvasTexture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = hex
  ctx.fillRect(0, 0, size, size)

  ctx.fillStyle = patternInk(hex)
  ctx.strokeStyle = patternInk(hex)
  ctx.lineWidth = size * 0.09

  const step = size / 3
  switch (pattern) {
    case 'dots':
      for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 3; col += 1) {
          ctx.beginPath()
          ctx.arc(step * (col + 0.5), step * (row + 0.5), size * 0.075, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      break
    case 'horizontal stripes':
      for (let row = 0; row < 3; row += 1) ctx.fillRect(0, step * row + step * 0.25, size, step * 0.4)
      break
    case 'vertical stripes':
      for (let col = 0; col < 3; col += 1) ctx.fillRect(step * col + step * 0.25, 0, step * 0.4, size)
      break
    case 'crosshatch':
      for (let i = 0; i < 3; i += 1) {
        ctx.fillRect(0, step * i + step * 0.35, size, step * 0.3)
        ctx.fillRect(step * i + step * 0.35, 0, step * 0.3, size)
      }
      break
    case 'diagonal stripes':
      ctx.beginPath()
      for (let offset = -size; offset < size * 2; offset += size / 4) {
        ctx.moveTo(offset, 0)
        ctx.lineTo(offset + size, size)
      }
      ctx.stroke()
      break
    case 'checkerboard':
      for (let row = 0; row < 4; row += 1) {
        for (let col = 0; col < 4; col += 1) {
          if ((row + col) % 2 === 0) ctx.fillRect((size / 4) * col, (size / 4) * row, size / 4, size / 4)
        }
      }
      break
    case 'waves':
      ctx.lineWidth = size * 0.07
      for (let row = 0; row < 3; row += 1) {
        ctx.beginPath()
        const y = step * (row + 0.5)
        for (let x = 0; x <= size; x += 1) {
          const wave = y + Math.sin((x / size) * Math.PI * 4) * size * 0.05
          if (x === 0) ctx.moveTo(x, wave)
          else ctx.lineTo(x, wave)
        }
        ctx.stroke()
      }
      break
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

export function createHeroScene(canvas: HTMLCanvasElement, options: Options): HeroScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
  camera.position.set(0, 0, 9)

  scene.add(new THREE.AmbientLight(0xffffff, 1.05))

  const key = new THREE.DirectionalLight(0xffffff, 2.1)
  key.position.set(4, 6, 8)
  scene.add(key)

  // Gold and cyan rims, the two accent hues the app's Classic theme uses.
  const gold = new THREE.PointLight(0xffc73d, 60, 30)
  gold.position.set(-6, 3, 4)
  scene.add(gold)

  const cyan = new THREE.PointLight(0x29c9d9, 45, 30)
  cyan.position.set(6, -3, 3)
  scene.add(cyan)

  const world = new THREE.Group()
  scene.add(world)

  const geometry = new RoundedBoxGeometry(0.86, 0.86, 0.86, 4, 0.16)
  const textures: THREE.CanvasTexture[] = []
  const materials: THREE.Material[] = []

  type Floater = { group: THREE.Group; spin: THREE.Vector3; phase: number; bob: number }
  const floaters: Floater[] = []

  for (const cluster of CLUSTERS) {
    const block = BLOCKS[cluster.block % BLOCKS.length]
    const texture = faceTexture(block.hex, block.pattern)
    textures.push(texture)

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.35,
      metalness: 0.05,
      emissive: new THREE.Color(block.hex),
      emissiveIntensity: 0.12,
    })
    materials.push(material)

    const group = new THREE.Group()
    const height = cluster.rows.length
    const width = Math.max(...cluster.rows.map((row) => row.length))

    cluster.rows.forEach((row, r) => {
      row.split('').forEach((character, c) => {
        if (character !== 'X') return
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(c - (width - 1) / 2, (height - 1) / 2 - r, 0)
        group.add(mesh)
      })
    })

    group.position.set(...cluster.position)
    group.rotation.set(Math.random() * 0.6 - 0.3, Math.random() * 0.9 - 0.45, Math.random() * 0.3 - 0.15)
    world.add(group)

    floaters.push({
      group,
      spin: new THREE.Vector3(
        (Math.random() - 0.5) * 0.09,
        (Math.random() - 0.5) * 0.13,
        (Math.random() - 0.5) * 0.05,
      ),
      phase: Math.random() * Math.PI * 2,
      bob: 0.1 + Math.random() * 0.12,
    })
  }

  const pointer = new THREE.Vector2()
  const pointerTarget = new THREE.Vector2()
  let scrollProgress = 0
  let frame = 0
  let disposed = false

  function resize() {
    const { clientWidth, clientHeight } = canvas
    if (clientWidth === 0 || clientHeight === 0) return
    renderer.setSize(clientWidth, clientHeight, false)
    camera.aspect = clientWidth / clientHeight
    // Pull the formation back on narrow screens so nothing crops.
    camera.position.z = camera.aspect < 0.85 ? 13 : 9
    camera.updateProjectionMatrix()
  }

  const observer = new ResizeObserver(resize)
  observer.observe(canvas)
  resize()

  const clock = new THREE.Clock()

  function render() {
    const elapsed = clock.getElapsedTime()

    if (!options.reducedMotion) {
      for (const floater of floaters) {
        floater.group.rotation.x += floater.spin.x * 0.016
        floater.group.rotation.y += floater.spin.y * 0.016
        floater.group.rotation.z += floater.spin.z * 0.016
        floater.group.position.y += Math.sin(elapsed * 0.6 + floater.phase) * floater.bob * 0.01
      }
    }

    pointer.lerp(pointerTarget, 0.06)
    world.rotation.y = pointer.x * 0.28 + scrollProgress * 0.5
    world.rotation.x = -pointer.y * 0.18
    world.position.y = scrollProgress * 1.6
    camera.position.x = pointer.x * 0.6
    camera.position.y = -pointer.y * 0.4

    renderer.render(scene, camera)
  }

  function loop() {
    if (disposed) return
    frame = requestAnimationFrame(loop)
    render()
  }

  // Reduce Motion still gets the scene — it just holds still until the pointer
  // or the scroll position asks it to move.
  if (options.reducedMotion) {
    render()
  } else {
    loop()
  }

  const onVisibility = () => {
    if (options.reducedMotion) return
    if (document.hidden) {
      cancelAnimationFrame(frame)
    } else {
      loop()
    }
  }
  document.addEventListener('visibilitychange', onVisibility)

  return {
    setScrollProgress(progress) {
      scrollProgress = progress
      if (options.reducedMotion) render()
    },
    setPointer(x, y) {
      pointerTarget.set(x, y)
      if (options.reducedMotion) render()
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(frame)
      document.removeEventListener('visibilitychange', onVisibility)
      observer.disconnect()
      geometry.dispose()
      for (const material of materials) material.dispose()
      for (const texture of textures) texture.dispose()
      renderer.dispose()
    },
  }
}
