import { useEffect, useRef, type ReactNode } from 'react'
import { gsap, useReducedMotion } from '../lib/motion'

type RevealProps = {
  children: ReactNode
  className?: string
  /** Seconds of delay — used as a stagger when several siblings reveal together. */
  delay?: number
  /** Entrance direction. `none` fades in place. */
  from?: 'up' | 'left' | 'right' | 'none'
}

/**
 * Scroll-triggered entrance. With Reduce Motion on, the element renders in its
 * final state and no ScrollTrigger is ever created.
 */
export default function Reveal({ children, className, delay = 0, from = 'up' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const element = ref.current
    if (!element || reduced) return

    const offset =
      from === 'up'
        ? { y: 28 }
        : from === 'left'
          ? { x: -32 }
          : from === 'right'
            ? { x: 32 }
            : {}

    const animation = gsap.fromTo(
      element,
      { autoAlpha: 0, ...offset },
      {
        autoAlpha: 1,
        x: 0,
        y: 0,
        duration: 0.7,
        delay,
        ease: 'power3.out',
        scrollTrigger: { trigger: element, start: 'top 88%', once: true },
      },
    )

    return () => {
      animation.scrollTrigger?.kill()
      animation.kill()
      gsap.set(element, { clearProps: 'all' })
    }
  }, [delay, from, reduced])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
