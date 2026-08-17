import { StrictMode, lazy } from 'react'
import type { ComponentType } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import type { PageMap } from './App'
import { ROUTE_LOADERS, ROUTE_PATHS, matchRoute } from './routes'
import './index.css'

const base = import.meta.env.BASE_URL
const container = document.getElementById('root')!

/**
 * The page arrives prerendered, so hydration has to begin with the entry
 * route's component already in hand. `React.lazy` cannot do that even for an
 * import that has already settled — it suspends for at least one microtask on
 * first read, and React would hydrate the Suspense fallback over real content.
 * So the entry route is awaited and passed in resolved, and every *other* route
 * stays lazy and ships as its own chunk.
 */
const current = matchRoute(window.location.pathname, base)

void (current ? ROUTE_LOADERS[current]() : Promise.resolve(null)).then((entryModule) => {
  const pages = Object.fromEntries(
    ROUTE_PATHS.map((path) => [
      path,
      path === current && entryModule
        ? entryModule.default
        : (lazy(ROUTE_LOADERS[path]) as ComponentType),
    ]),
  ) as PageMap

  const tree = (
    <StrictMode>
      <BrowserRouter basename={base}>
        <App pages={pages} />
      </BrowserRouter>
    </StrictMode>
  )

  // `firstElementChild`, not `hasChildNodes`: in dev the container still holds
  // the `<!--app-html-->` marker, which is a child node but not prerendered
  // markup — hydrating against it fails on every page load.
  if (container.firstElementChild) {
    hydrateRoot(container, tree)
  } else {
    createRoot(container).render(tree)
  }

  // The app booted, so the "reveal everything if the bundle never arrives"
  // safety net in index.html is no longer needed.
  const fallback = (window as unknown as { __motionFallback?: number }).__motionFallback
  if (fallback) clearTimeout(fallback)
})
