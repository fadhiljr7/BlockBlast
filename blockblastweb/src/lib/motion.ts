import { useEffect, useRef, useSyncExternalStore } from 'react'
import type { RefObject } from 'react'
import type { gsap as GsapType } from 'gsap'
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

/**
 * Live reduced-motion preference. It is a subscription rather than a one-shot
 * read because macOS and iOS let the setting change while the page is open, and
 * a visitor who turns it on mid-scroll should not have to reload to be believed.
 *
 * The server snapshot is `true`: prerendered HTML is emitted in its final,
 * motion-free state, so the page is readable before any JavaScript runs and
 * nothing flashes in from opacity 0 if the bundle never arrives.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => true,
  )
}

export type GsapModules = {
  gsap: typeof GsapType
  ScrollTrigger: typeof ScrollTriggerType
}

let modulesPromise: Promise<GsapModules> | null = null

/**
 * Loads GSAP + ScrollTrigger once, on demand. Dynamic so the animation engine
 * stays out of the entry bundle and is never fetched at all by visitors who
 * have asked for reduced motion.
 */
export function loadGsap(): Promise<GsapModules> {
  modulesPromise ??= Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
    ([core, scroll]) => {
      const gsap = core.gsap
      const ScrollTrigger = scroll.ScrollTrigger
      gsap.registerPlugin(ScrollTrigger)
      gsap.defaults({ ease: 'power3.out', duration: 0.9 })
      return { gsap, ScrollTrigger }
    },
  )
  return modulesPromise
}

type SetupFn = (modules: GsapModules & { scope: HTMLElement }) => void

/**
 * Scoped GSAP effect. Everything the setup function creates is registered in a
 * `gsap.context`, so a single `revert()` undoes the tweens, the inline styles
 * and the ScrollTriggers together — which is what makes this safe under React
 * StrictMode's double-invoked effects and under route changes.
 *
 * When reduced motion is on, the setup function never runs: elements keep their
 * natural, final-state styles instead of being animated to them.
 */
export function useGsapEffect(
  scopeRef: RefObject<HTMLElement | null>,
  setup: SetupFn,
  deps: unknown[] = [],
) {
  const reduced = usePrefersReducedMotion()

  // The setup function is a fresh closure on every render, so it is held in a
  // ref instead of in the dependency array — otherwise the timeline would be
  // rebuilt on every render. The ref is written in its own effect (never during
  // render) and declared first, so it is always current before the effect below
  // reads it.
  const setupRef = useRef(setup)
  useEffect(() => {
    setupRef.current = setup
  })

  useEffect(() => {
    const scope = scopeRef.current
    if (reduced || !scope) return

    let context: ReturnType<typeof GsapType.context> | undefined
    let cancelled = false

    void loadGsap().then((modules) => {
      if (cancelled) return
      context = modules.gsap.context(() => {
        setupRef.current({ ...modules, scope })
      }, scope)
      // Sections above the fold can mount before fonts and images settle;
      // one refresh pins the trigger positions to the real layout.
      modules.ScrollTrigger.refresh()
    })

    return () => {
      cancelled = true
      context?.revert()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, scopeRef, ...deps])
}

/**
 * Splits a string into per-word spans for stagger reveals. Words stay inside a
 * masking span so they can slide up from behind a clean edge.
 *
 * The whole phrase is still exposed to assistive technology as one string by
 * the caller (via `aria-label` on the heading), because a screen reader reading
 * eleven separate spans is eleven separate stutters.
 */
export function splitWords(text: string): string[] {
  return text.split(' ').filter(Boolean)
}
