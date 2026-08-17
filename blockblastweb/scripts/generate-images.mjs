/**
 * Rasterises the SVG sources in scripts/assets into the PNGs that have to be
 * PNGs.
 *
 * Two of them cannot be vectors: social crawlers largely ignore `og:image`
 * when it is an SVG, and iOS ignores an SVG `apple-touch-icon` outright. The
 * sources stay as SVG so they remain editable and reviewable in the repo, and
 * this regenerates the bitmaps on demand rather than checking in binaries that
 * nobody can diff.
 *
 * Run with `npm run images` after changing anything in scripts/assets.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const assets = join(root, 'scripts', 'assets')
const publicDir = join(root, 'public')

async function render(source, output, width) {
  const svg = await readFile(join(assets, source), 'utf8')
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    // resvg has no browser font stack to fall back on, so the family used in
    // the sources is named explicitly here.
    font: { loadSystemFonts: true, defaultFontFamily: 'Helvetica' },
  })
  const png = resvg.render().asPng()
  await writeFile(join(publicDir, output), png)
  console.log(`${output} — ${width}px wide, ${(png.length / 1024).toFixed(1)} KB`)
}

await render('og-card.svg', 'og-card.png', 1200)
await render('touch-icon.svg', 'apple-touch-icon.png', 180)
