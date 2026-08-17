import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { usePrefersReducedMotion } from '../lib/motion'

export type Emitter = {
  /** Burst at a point in the field's own pixel coordinates. */
  burst: (x: number, y: number, colour: string) => void
}

const POOL = 144
const PER_BURST = 11

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  vz: number
  z: number
  spin: number
  rotation: number
  size: number
  life: number
  maxLife: number
}

/**
 * One WebGL canvas shared by every feature card, rather than one per card.
 *
 * Six canvases would mean six GL contexts — browsers cap the total at around
 * sixteen and start dropping the oldest — so the whole grid emits into a single
 * orthographic scene whose world units are the section's own pixels. The render
 * loop only runs while particles are alive, so an idle grid costs nothing.
 */
export function ParticleField({ emitter }: { emitter: RefObject<Emitter | null> }) {
  const holderRef = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const holder = holderRef.current
    // A burst is pure decoration, so reduced motion gets no canvas at all — not
    // a frozen one.
    if (!holder || reduced) return

    let cancelled = false
    let cleanup = () => {}

    void import('three')
      .then((THREE) => {
        if (cancelled) return

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.domElement.setAttribute('aria-hidden', 'true')
        renderer.domElement.style.width = '100%'
        renderer.domElement.style.height = '100%'
        renderer.domElement.style.display = 'block'
        holder.appendChild(renderer.domElement)

        const scene = new THREE.Scene()
        scene.add(new THREE.AmbientLight(0xffffff, 1.4))
        const light = new THREE.DirectionalLight(0xffffff, 2)
        light.position.set(0.4, -1, 1)
        scene.add(light)

        // Pixel-space orthographic camera: world x/y are CSS pixels with y
        // pointing down, so a card's `getBoundingClientRect` needs no mapping.
        const camera = new THREE.OrthographicCamera(0, 1, 0, 1, -500, 500)
        camera.position.z = 100

        const geometry = new THREE.BoxGeometry(1, 1, 1)
        const material = new THREE.MeshStandardMaterial({
          transparent: true,
          opacity: 0.95,
          roughness: 0.35,
          metalness: 0.05,
        })
        const mesh = new THREE.InstancedMesh(geometry, material, POOL)
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
        mesh.frustumCulled = false
        scene.add(mesh)

        const particles: Particle[] = Array.from({ length: POOL }, () => ({
          x: 0, y: 0, vx: 0, vy: 0, vz: 0, z: 0,
          spin: 0, rotation: 0, size: 0, life: 0, maxLife: 1,
        }))
        const colour = new THREE.Color()
        const dummy = new THREE.Object3D()
        let cursor = 0
        let alive = 0
        let frame = 0
        let last = 0

        const resize = () => {
          const width = holder.clientWidth
          const height = holder.clientHeight
          if (!width || !height) return
          camera.left = 0
          camera.right = width
          camera.top = 0
          camera.bottom = height
          camera.updateProjectionMatrix()
          renderer.setSize(width, height, false)
        }
        resize()
        const resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(holder)

        const render = () => {
          for (let index = 0; index < POOL; index += 1) {
            const particle = particles[index]
            if (particle.life <= 0) {
              // Retired particles are scaled to nothing rather than removed —
              // an InstancedMesh always draws its full count.
              dummy.position.set(0, 0, -400)
              dummy.scale.setScalar(0)
              dummy.rotation.set(0, 0, 0)
            } else {
              const progress = particle.life / particle.maxLife
              dummy.position.set(particle.x, particle.y, particle.z)
              dummy.rotation.set(particle.rotation, particle.rotation * 0.7, particle.rotation * 0.4)
              dummy.scale.setScalar(particle.size * progress)
            }
            dummy.updateMatrix()
            mesh.setMatrixAt(index, dummy.matrix)
          }
          mesh.instanceMatrix.needsUpdate = true
          renderer.render(scene, camera)
        }

        const step = (time: number) => {
          const delta = Math.min((time - last) / 1000, 0.05)
          last = time
          alive = 0

          for (const particle of particles) {
            if (particle.life <= 0) continue
            particle.life -= delta
            if (particle.life <= 0) continue
            alive += 1
            particle.x += particle.vx * delta
            particle.y += particle.vy * delta
            particle.z += particle.vz * delta
            particle.vy += 520 * delta // gravity, in pixels per second squared
            particle.vx *= 0.985
            particle.rotation += particle.spin * delta
          }

          render()

          if (alive > 0) {
            frame = requestAnimationFrame(step)
          } else {
            frame = 0
          }
        }

        emitter.current = {
          burst(x, y, hex) {
            colour.set(hex)
            for (let index = 0; index < PER_BURST; index += 1) {
              const particle = particles[cursor]
              mesh.setColorAt(cursor, colour)
              cursor = (cursor + 1) % POOL

              const angle = (index / PER_BURST) * Math.PI * 2 + Math.random() * 0.5
              const speed = 90 + Math.random() * 130
              particle.x = x
              particle.y = y
              particle.z = Math.random() * 20
              particle.vx = Math.cos(angle) * speed
              particle.vy = Math.sin(angle) * speed - 120
              particle.vz = (Math.random() - 0.5) * 60
              particle.size = 5 + Math.random() * 8
              particle.rotation = Math.random() * Math.PI
              particle.spin = (Math.random() - 0.5) * 9
              particle.maxLife = 0.75 + Math.random() * 0.5
              particle.life = particle.maxLife
            }
            if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
            if (!frame) {
              last = performance.now()
              frame = requestAnimationFrame(step)
            }
          },
        }

        render()

        cleanup = () => {
          cancelAnimationFrame(frame)
          resizeObserver.disconnect()
          emitter.current = null
          geometry.dispose()
          material.dispose()
          mesh.dispose()
          renderer.dispose()
          renderer.domElement.remove()
        }
      })
      .catch(() => {
        /* No WebGL: the cards keep their CSS hover states and lose nothing. */
      })

    return () => {
      cancelled = true
      cleanup()
    }
  }, [emitter, reduced])

  return (
    <div
      ref={holderRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
    />
  )
}
