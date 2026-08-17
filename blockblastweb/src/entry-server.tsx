import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import App from './App'
import type { PageMap } from './App'
import { ROUTE_LOADERS, ROUTE_PATHS } from './routes'
import type { RoutePath } from './routes'
import { PAGE_META, canonicalPath, jsonLdScripts, metaForPath } from './lib/seo'
import { SITE } from './data/site'

export { ROUTE_PATHS }

/** Deployment base, e.g. `/BlockBlast/`. */
const BASE = import.meta.env.BASE_URL

/**
 * Renders one route to finished HTML plus the head fragment that belongs to it.
 * Every route module is awaited first so nothing renders as a Suspense
 * fallback — the prerendered file has to contain the real content for crawlers
 * and for visitors whose JavaScript never arrives.
 *
 * The router gets the same `basename` the client will use. Without it the
 * prerendered `<a href>` values would omit the repository prefix: dead links
 * before hydration, and an attribute mismatch the moment React takes over.
 */
export async function renderRoute(path: RoutePath): Promise<{ html: string; head: string }> {
  const modules = await Promise.all(
    ROUTE_PATHS.map(async (route) => [route, (await ROUTE_LOADERS[route]()).default] as const),
  )
  const pages = Object.fromEntries(modules) as unknown as PageMap

  const location = `${BASE.replace(/\/$/, '')}${path}`

  const html = renderToString(
    <StrictMode>
      <StaticRouter basename={BASE} location={location}>
        <App pages={pages} />
      </StaticRouter>
    </StrictMode>,
  )

  return { html, head: headFor(path) }
}

function escape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
}

function headFor(path: RoutePath): string {
  const meta = metaForPath(path)
  const canonical = `${SITE.url}${canonicalPath(path)}`
  const ogImage = `${SITE.url}/og-card.png`

  return [
    `<title>${escape(meta.title)}</title>`,
    `<meta name="description" content="${escape(meta.description)}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escape(SITE.name)}" />`,
    `<meta property="og:title" content="${escape(meta.title)}" />`,
    `<meta property="og:description" content="${escape(meta.description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${ogImage}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="Block Blast: Accessible Edition — a puzzle game playable by everyone." />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escape(meta.title)}" />`,
    `<meta name="twitter:description" content="${escape(meta.description)}" />`,
    `<meta name="twitter:image" content="${ogImage}" />`,
    jsonLdScripts(meta),
  ].join('\n    ')
}

/** Consumed by the prerenderer to build sitemap.xml. */
export const SITEMAP_ROUTES = Object.values(PAGE_META).map((meta) => meta.path)
export const SITE_URL = SITE.url
export { canonicalPath }
