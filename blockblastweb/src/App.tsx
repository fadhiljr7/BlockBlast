import { Suspense, createElement, useEffect, useRef, useState } from 'react'
import type { ComponentType } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { SvgDefs } from './components/SvgDefs'
import { NotFound } from './pages/NotFound'
import { ROUTE_PATHS } from './routes'
import type { RoutePath } from './routes'
import { loadGsap, usePrefersReducedMotion } from './lib/motion'
import { metaForPath, useSeo } from './lib/seo'

export type PageMap = Record<RoutePath, ComponentType>

/**
 * Route-level transition.
 *
 * The displayed location lags the real one by the length of the fade-out, so
 * the outgoing page actually gets to leave before the incoming one slides up —
 * a cross-fade rather than a cut. Under reduced motion the lag is skipped
 * entirely and the swap is instant.
 */
function RouteTransition({ pages }: { pages: PageMap }) {
  const location = useLocation()
  const [displayed, setDisplayed] = useState(location)
  const containerRef = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()
  const isFirstRender = useRef(true)

  useSeo(metaForPath(displayed.pathname))

  // With reduced motion there is no fade to wait for, so the displayed location
  // catches up during render rather than in an effect — React re-renders
  // immediately with the new route instead of painting the old one first.
  if (reduced && location.pathname !== displayed.pathname) {
    setDisplayed(location)
  }

  useEffect(() => {
    if (reduced || location.pathname === displayed.pathname) return
    let cancelled = false
    void loadGsap().then(({ gsap }) => {
      if (cancelled || !containerRef.current) {
        setDisplayed(location)
        return
      }
      gsap.to(containerRef.current, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.inOut',
        onComplete: () => setDisplayed(location),
      })
    })
    return () => {
      cancelled = true
    }
  }, [location, displayed.pathname, reduced])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // The very first paint is the prerendered HTML — animating it in would mean
    // hiding content that is already there and already readable.
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (displayed.hash) {
      document.getElementById(displayed.hash.slice(1))?.scrollIntoView({ block: 'start' })
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }

    // Move focus to the top of the new page so screen reader and keyboard users
    // are told the view changed instead of being left in the old tab order.
    document.getElementById('main')?.focus({ preventScroll: true })

    if (reduced) {
      container.style.opacity = '1'
      return
    }

    let cancelled = false
    void loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (cancelled) return
      gsap.fromTo(
        container,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: 'power3.out',
          onComplete: () => ScrollTrigger.refresh(),
        },
      )
    })
    return () => {
      cancelled = true
    }
  }, [displayed, reduced])

  return (
    <div ref={containerRef}>
      <Suspense
        fallback={
          <div className="shell flex min-h-[60vh] items-center py-24">
            <p role="status" className="text-ink-dim">
              Loading…
            </p>
          </div>
        }
      >
        <Routes location={displayed}>
          {ROUTE_PATHS.map((path) => (
            <Route key={path} path={path} element={createElement(pages[path])} />
          ))}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default function App({ pages }: { pages: PageMap }) {
  return (
    <>
      <SvgDefs />
      <Layout>
        <RouteTransition pages={pages} />
      </Layout>
    </>
  )
}
