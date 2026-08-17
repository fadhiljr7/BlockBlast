import { useEffect, useRef, useState } from 'react'
import { BLOCKS } from '../lib/blocks'
import { usePrefersReducedMotion } from '../lib/motion'

const GRID = 8
const COUNT = GRID * GRID
const SPACING = 1.18

/**
 * The hero's living 8×8 board: one `InstancedMesh` of 64 translucent blocks that
 * drift, breathe and lean towards the pointer.
 *
 * It is decoration, so the canvas is `aria-hidden` and a text alternative sits
 * beside it in the DOM. Three.js is imported dynamically, which keeps ~150 KB
 * of WebGL out of the entry bundle and means it is never fetched at all by
 * visitors who have asked for reduced motion.
 */
export function HeroGrid() {
  const holderRef = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const holder = holderRef.current
    if (!holder) return

    let cancelled = false
    let cleanup = () => {}

    void import('three')
      .then((THREE) => {
        if (cancelled) return

        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setSize(holder.clientWidth, holder.clientHeight, false)
        renderer.domElement.setAttribute('aria-hidden', 'true')
        renderer.domElement.style.width = '100%'
        renderer.domElement.style.height = '100%'
        renderer.domElement.style.display = 'block'
        holder.appendChild(renderer.domElement)

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(
          38,
          holder.clientWidth / holder.clientHeight,
          0.1,
          100,
        )
        camera.position.set(0, 0, 16.5)

        scene.add(new THREE.AmbientLight(0xffffff, 1.1))
        const key = new THREE.DirectionalLight(0xffffff, 2.2)
        key.position.set(4, 6, 8)
        scene.add(key)
        const rim = new THREE.DirectionalLight(0xe94560, 1.6)
        rim.position.set(-6, -3, 4)
        scene.add(rim)

        const geometry = new THREE.BoxGeometry(0.86, 0.86, 0.86)
        const material = new THREE.MeshStandardMaterial({
          transparent: true,
          opacity: 0.62,
          roughness: 0.28,
          metalness: 0.12,
        })
        const mesh = new THREE.InstancedMesh(geometry, material, COUNT)
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

        // Per-instance colour comes straight from the game's block palette, so
        // even the decoration is describing the real seven blocks.
        const colour = new THREE.Color()
        const seeds: number[] = []
        for (let index = 0; index < COUNT; index += 1) {
          const block = BLOCKS[index % BLOCKS.length]
          colour.set(block.hex)
          // The screen is dark; unlit faces read better slightly desaturated.
          mesh.setColorAt(index, colour.multiplyScalar(0.92))
          seeds.push(Math.random() * Math.PI * 2)
        }
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true

        // The group carries the whole-board tilt so per-instance matrices stay
        // free to describe only each block's own motion.
        const group = new THREE.Group()
        // On a landscape viewport the board sits to the right of the headline
        // rather than behind it; on a narrow one it stays centred, because
        // there is no "beside" to move to.
        const layOutBoard = () => {
          const wide = holder.clientWidth / Math.max(holder.clientHeight, 1) > 1.1
          group.position.x = wide ? 3.1 : 0
        }
        layOutBoard()
        group.add(mesh)
        scene.add(group)

        const dummy = new THREE.Object3D()
        const half = (GRID - 1) / 2
        const pointer = { x: 0, y: 0 }
        const eased = { x: 0, y: 0 }

        const onPointerMove = (event: PointerEvent) => {
          pointer.x = (event.clientX / window.innerWidth) * 2 - 1
          pointer.y = -((event.clientY / window.innerHeight) * 2 - 1)
        }
        window.addEventListener('pointermove', onPointerMove, { passive: true })

        const draw = (time: number) => {
          // Pointer input is eased rather than applied directly: the grid
          // follows the cursor, it does not snap to it.
          eased.x += (pointer.x - eased.x) * 0.045
          eased.y += (pointer.y - eased.y) * 0.045

          group.rotation.y = eased.x * 0.32 + Math.sin(time * 0.00013) * 0.12
          group.rotation.x = -eased.y * 0.24 + Math.cos(time * 0.00011) * 0.08

          for (let index = 0; index < COUNT; index += 1) {
            const row = Math.floor(index / GRID)
            const col = index % GRID
            const x = (col - half) * SPACING
            const y = (half - row) * SPACING
            const seed = seeds[index]

            // Each block breathes on its own phase, and a slow diagonal wave
            // crosses the board so the grid reads as one surface, not 64 toys.
            const wave = Math.sin(time * 0.0009 + seed + (col + row) * 0.35)
            const scale = 0.86 + wave * 0.09

            // Blocks nearest the pointer lift towards the viewer.
            const dx = x / (half * SPACING) - eased.x
            const dy = y / (half * SPACING) - eased.y
            const proximity = Math.max(0, 1 - Math.hypot(dx, dy) / 1.1)

            dummy.position.set(x, y + wave * 0.12, wave * 0.35 + proximity * 1.15)
            dummy.rotation.set(wave * 0.14, time * 0.00018 + seed * 0.1, wave * 0.08)
            dummy.scale.setScalar(scale + proximity * 0.16)
            dummy.updateMatrix()
            mesh.setMatrixAt(index, dummy.matrix)
          }
          mesh.instanceMatrix.needsUpdate = true
          renderer.render(scene, camera)
        }

        let frame = 0
        let running = false
        const loop = (time: number) => {
          draw(time)
          frame = requestAnimationFrame(loop)
        }

        const start = () => {
          if (running || reduced) return
          running = true
          frame = requestAnimationFrame(loop)
        }
        const stop = () => {
          running = false
          cancelAnimationFrame(frame)
        }

        // One frame is always drawn, so reduced-motion visitors and paused
        // tabs still see a fully composed board rather than an empty canvas.
        draw(0)

        // Off-screen or backgrounded, the loop stops entirely — a WebGL canvas
        // spinning behind a scrolled-past hero is pure battery cost.
        const observer = new IntersectionObserver(
          ([entry]) => (entry.isIntersecting && !document.hidden ? start() : stop()),
          { threshold: 0.01 },
        )
        observer.observe(holder)

        const onVisibility = () => (document.hidden ? stop() : start())
        document.addEventListener('visibilitychange', onVisibility)

        const onResize = () => {
          const { clientWidth, clientHeight } = holder
          if (!clientWidth || !clientHeight) return
          camera.aspect = clientWidth / clientHeight
          camera.updateProjectionMatrix()
          layOutBoard()
          renderer.setSize(clientWidth, clientHeight, false)
          draw(performance.now())
        }
        const resizeObserver = new ResizeObserver(onResize)
        resizeObserver.observe(holder)

        const onContextLost = (event: Event) => {
          event.preventDefault()
          stop()
          setFailed(true)
        }
        renderer.domElement.addEventListener('webglcontextlost', onContextLost)

        cleanup = () => {
          stop()
          observer.disconnect()
          resizeObserver.disconnect()
          document.removeEventListener('visibilitychange', onVisibility)
          window.removeEventListener('pointermove', onPointerMove)
          renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
          geometry.dispose()
          material.dispose()
          mesh.dispose()
          renderer.dispose()
          renderer.domElement.remove()
        }
      })
      .catch(() => {
        // No WebGL, or the chunk failed: the gradient fallback stands in and
        // the hero copy is unaffected either way.
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
      cleanup()
    }
  }, [reduced])

  return (
    <div
      ref={holderRef}
      aria-hidden="true"
      className={`absolute inset-0 ${failed ? 'opacity-0' : ''}`}
      data-testid="hero-grid"
    />
  )
}
