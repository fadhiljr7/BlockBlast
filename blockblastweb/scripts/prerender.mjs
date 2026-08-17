/**
 * Turns the SPA build into real HTML files, one per route.
 *
 * Vite produces `dist/index.html` (the client shell) and `dist-ssr/` (the same
 * app compiled for Node). This renders each route with the Node build and
 * writes the result into a copy of the shell, so `/support` is a genuine
 * document with its own title, description, structured data and full body copy
 * — for crawlers, for link previews, and for anyone whose JavaScript never
 * arrives. The client then hydrates on top of it.
 *
 * Also emits sitemap.xml, robots.txt and the GitHub Pages 404 fallback.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const distDir = join(root, 'dist')
const ssrEntry = pathToFileURL(join(root, 'dist-ssr', 'entry-server.js')).href

const { renderRoute, ROUTE_PATHS, SITE_URL, canonicalPath } = await import(ssrEntry)

const template = await readFile(join(distDir, 'index.html'), 'utf8')

if (!template.includes('<!--app-html-->')) {
  throw new Error('index.html is missing the <!--app-html--> marker')
}

/** Route path to the file that serves it. `/` is index.html, others get a directory. */
function outputPath(route) {
  return route === '/' ? join(distDir, 'index.html') : join(distDir, route.slice(1), 'index.html')
}

const written = []

for (const route of ROUTE_PATHS) {
  const { html, head } = await renderRoute(route)

  const page = template
    .replace('<!--app-html-->', html)
    // The shell carries the landing page's tags between these markers; each
    // route replaces the whole block with its own.
    .replace(/<!--app-head-->[\s\S]*?<!--\/app-head-->/, head)

  const file = outputPath(route)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, page, 'utf8')
  written.push(route)
}

/*
 * GitHub Pages has no rewrite rules, so a deep link to a path it cannot resolve
 * falls back to 404.html. Serving the app's own 404 route from there means a
 * mistyped URL still gets the styled page, and the router takes over from
 * whatever address the visitor actually asked for.
 */
const { html: notFoundHtml, head: notFoundHead } = await renderRoute('/404')
await writeFile(
  join(distDir, '404.html'),
  template
    .replace('<!--app-html-->', notFoundHtml)
    .replace(/<!--app-head-->[\s\S]*?<!--\/app-head-->/, notFoundHead),
  'utf8',
)

const lastmod = new Date().toISOString().slice(0, 10)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ROUTE_PATHS.map(
  (route) => `  <url>
    <loc>${SITE_URL}${canonicalPath(route)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`,
).join('\n')}
</urlset>
`
await writeFile(join(distDir, 'sitemap.xml'), sitemap, 'utf8')

await writeFile(
  join(distDir, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
  'utf8',
)

console.log(`Prerendered ${written.length} routes: ${written.join(', ')}`)
console.log('Wrote 404.html, sitemap.xml and robots.txt')
