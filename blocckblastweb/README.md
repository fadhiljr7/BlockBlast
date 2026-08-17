# Block Blast — website

Marketing and support site for the **Block Blast: Accessible Edition** iOS app that lives in the
repository root. Frontend only: no server, no API, no database.

| | |
|---|---|
| Stack | Vite · React 19 · TypeScript · React Router 7 |
| Styling | Tailwind CSS v4 (`@theme` tokens in `src/index.css`) |
| 3D | Three.js — hero scene, dynamically imported |
| Motion | GSAP + ScrollTrigger |

```bash
npm run dev         # http://localhost:5173
npm run lint
npm run build       # GitHub Pages build — assets under /BlockBlast/
npm run build:root  # root-hosted build (Netlify, Vercel, custom domain)
npm run preview     # serves the last build
```

**Pick the build that matches the host.** `npm run build` writes asset URLs as
`/BlockBlast/assets/…`, which is right for `fadhiljr7.github.io/BlockBlast` and wrong everywhere
else — on a root domain the browser requests a path that does not exist, no JavaScript runs, and you
get a blank dark page. Use `npm run build:root` for any host that serves from `/`.

## Routes

| Path | Page |
|---|---|
| `/` | Landing — hero, three channels, features, block key, placement modes, playable demo, sound, themes |
| `/support` | Guides, FAQ, bug-report checklist, contact |
| `/privacy` | Privacy policy for the app and this site |
| `*` | Not found |

`BrowserRouter` gets its `basename` from `import.meta.env.BASE_URL`, so the same build works at
`/BlockBlast/` on GitHub Pages and at `/` on a custom domain (`BASE_PATH=/ npm run build`). GitHub
Pages has no SPA rewrite, so the build writes `dist/404.html` as a copy of `index.html` — a hard
refresh on `/support` lands there and the router takes over.

## Where the content comes from

The site is not written from imagination; every claim traces back to the iOS source:

| Site | iOS source |
|---|---|
| `src/lib/game.ts` | `Models/Board.swift`, `Game/GameEngine.swift` — 8×8, 30 silhouettes with weights, `cells + lines² × 10 × combo` |
| `src/data/site.ts` — `BLOCKS` | `Models/BlockColor.swift` — colour, pattern and tone offset per block |
| `src/lib/vision.ts` | `VisionSimulation` — the same Brettel/Viénot matrices |
| `src/data/site.ts` — `THEMES` | `Theme/Theme.swift` — six palettes |
| `src/data/site.ts` — `PLACEMENT_MODES` | `Game/GameSettings.swift` |
| `src/lib/tone.ts` | `Audio/` — pentatonic row-to-pitch mapping, column to stereo position |

If a rule changes in the app, change it in the matching file here rather than in a component.

## Layout

```
src/
├── components/   Layout, Reveal, BlockTile, PieceView, Accordion, AppStoreButton, SectionHeading
├── data/         site.ts — every string that appears more than once
├── lib/          game.ts (rules), patterns.ts, vision.ts, tone.ts, motion.ts, meta.ts
├── pages/        Landing, Support, Privacy, NotFound
├── sections/     Landing-page sections
└── three/        heroScene.ts + the React wrapper that mounts it
```

## Accessibility notes

The site is held to the same bar as the app it describes.

- **Reduce Motion is a real branch.** Every GSAP entrance is skipped, the hero scene stops its
  animation loop and renders single frames, and the CSS in `index.css` neutralises transitions.
- **The demo board is keyboard-operable.** It is one tab stop; arrow keys walk the grid, Enter
  places. Cells announce themselves the way the app does: “Row 3, column 5, empty, fits here,
  clears 2 lines.”
- **Colour is never the only signal**, including on this page — every block on the site is drawn
  with its pattern, and the block key section lets you switch on a colour-vision simulation and turn
  patterns off to see why that matters.
- **Audio never starts on its own.** The sonic-navigation board synthesises tones only in response
  to your input, and says so when the browser is still waiting for a gesture.

## Deploying

The build output is static.

**Netlify.** Connected to Git, `netlify.toml` already sets base `blocckblastweb`, command
`npm run build:root` and publish `dist`. Deploying by hand instead? Run `npm run build:root` and drag
that `dist` folder — dragging a `npm run build` folder is what produces a blank page. `public/_redirects`
ships inside `dist` and gives the router its SPA fallback, so `/support` survives a refresh.

**GitHub Pages.** Use `npm run build`. The repository workflow
(`.github/workflows/deploy-pages.yml`) still watches the old site directory — point its `paths`,
`working-directory` and `cache-dependency-path` at `blocckblastweb` to publish this one. Pages has no
redirect rules, so the build writes `dist/404.html` as a copy of `index.html` to do the same job.

**Whichever host wins**, update `og:url` and `og:image` in `index.html` to that domain — they are
absolute because social scrapers do not resolve relative URLs.
