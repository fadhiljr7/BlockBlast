import { useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }

const QUERY = '(prefers-reduced-motion: reduce)'

/** Read once, synchronously, for code that runs outside React. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(QUERY).matches
}

/**
 * Live-updating version. The app treats Reduce Motion as a first-class setting
 * rather than a degraded mode, and so does the site: nothing here fades in, it
 * is simply already there.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion)

  useEffect(() => {
    const media = window.matchMedia(QUERY)
    const update = () => setReduced(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return reduced
}
