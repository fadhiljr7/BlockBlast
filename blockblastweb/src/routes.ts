import type { ComponentType } from 'react'

/**
 * The route table, as loaders rather than components.
 *
 * The client turns each loader into `React.lazy` so routes ship as separate
 * chunks; the prerenderer awaits them so it can render finished HTML instead of
 * a Suspense fallback. Both consume this one table, so a route can never exist
 * in the app and be missing from the sitemap.
 */
export type RouteModule = { default: ComponentType }

export const ROUTE_LOADERS = {
  '/': () => import('./pages/Landing'),
  '/support': () => import('./pages/Support'),
  '/privacy': () => import('./pages/Privacy'),
} satisfies Record<string, () => Promise<RouteModule>>

export type RoutePath = keyof typeof ROUTE_LOADERS

export const ROUTE_PATHS = Object.keys(ROUTE_LOADERS) as RoutePath[]

/** Matches a pathname (with or without the deployment base) to a route. */
export function matchRoute(pathname: string, base = '/'): RoutePath | null {
  let path = pathname
  if (base !== '/' && path.startsWith(base.replace(/\/$/, ''))) {
    path = path.slice(base.replace(/\/$/, '').length) || '/'
  }
  const normalised = path.length > 1 ? path.replace(/\/+$/, '') : path
  return ROUTE_PATHS.includes(normalised as RoutePath) ? (normalised as RoutePath) : null
}
