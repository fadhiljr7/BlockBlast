import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger, useReducedMotion } from '../lib/motion'
import type { HeroScene } from './heroScene'

/**
 * Mounts the WebGL hero. Three is behind a dynamic import so it never lands in
 * the entry bundle, and the canvas is decorative: if WebGL is unavailable the
 * hero simply loses its background and every word stays where it was.
 */
export default function HeroCanvas({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let scene: HeroScene | undefined
    let trigger: ScrollTrigger | undefined
    let cancelled = false

    const onPointerMove = (event: PointerEvent) => {
      scene?.setPointer(
        (event.clientX / window.innerWidth) * 2 - 1,
        (event.clientY / window.innerHeight) * 2 - 1,
      )
    }

    void import('./heroScene')
      .then(({ createHeroScene }) => {
        const canvas = canvasRef.current
        if (cancelled || !canvas) return

        scene = createHeroScene(canvas, { reducedMotion: reduced })
        trigger = ScrollTrigger.create({
          trigger: canvas,
          start: 'top top',
          end: 'bottom top',
          onUpdate: (self) => scene?.setScrollProgress(self.progress),
        })
        window.addEventListener('pointermove', onPointerMove, { passive: true })
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
      window.removeEventListener('pointermove', onPointerMove)
      trigger?.kill()
      scene?.dispose()
    }
  }, [reduced])

  if (failed) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none h-full w-full ${className}`}
    />
  )
}
