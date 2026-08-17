# Block Blast — website

Marketing site for **Block Blast: Accessible Edition**, the iOS puzzle game in the root of this
repository. Three routes: the landing page, a support centre and a privacy policy — the last two
because App Store review requires them, and both written to be genuinely useful rather than to
satisfy a checklist.

The site is built to be an argument for the app rather than a description of it: the colour-blind
comparison, the block key and the demo board all run the game's real rules and its real palette,
lifted from the Swift source, so the page cannot drift away from what it is selling.

## Stack

Vite · React · TypeScript · Tailwind CSS v4 · GSAP (with ScrollTrigger) · Three.js · react-router ·
ESLint with `jsx-a11y` strict.

## Commands

```sh
npm install --legacy-peer-deps   # see "Dependency note" below
npm run dev                      # dev server
npm run build                    # typecheck, build, prerender, sitemap, robots.txt
npm run preview                  # serve the built site (use trailing-slash URLs — see below)
npm run lint                     # ESLint, including strict jsx-a11y
npm run typecheck                # tsc only
npm run check                    # verifies the demo board's rules against the app's
npm run images                   # regenerates og-card.png and apple-touch-icon.png
```

## How the build works

`npm run build` runs four steps:

1. `tsc -b` — typecheck.
2. `vite build` — the client bundle.
3. `vite build --ssr src/entry-server.tsx` — the same app compiled for Node.
4. `node scripts/prerender.mjs` — renders every route with the Node build and writes real HTML.

The result is a static site where `/`, `/support/` and `/privacy/` are complete documents with their
own titles, descriptions, Open Graph tags and structured data, plus `404.html`, `sitemap.xml` and
`robots.txt`. React then hydrates on top. A visitor whose JavaScript never arrives still gets the
whole site, including every FAQ answer.

Routes are lazy-loaded on the client, but the *entry* route is awaited before `hydrateRoot` — see the
comment in `src/main.tsx` for why `React.lazy` cannot be used there.

### Deployment

`.github/workflows/deploy-pages.yml` builds this folder and publishes `dist/` to GitHub Pages on
every push to `main` that touches it. The site is served from a project page, so `vite.config.ts`
sets `base` to `/BlockBlast/`; build with `BASE_PATH=/` for a root-hosted copy or a custom domain.

Deep links are directories (`/support/index.html`), which is what static hosts serve. `vite preview`
does *not* redirect `/support` → `/support/` the way GitHub Pages does — it returns the SPA fallback
instead — so when checking a local build, use the trailing slash.

## Accessibility

The site is held to the standard the game is: WCAG 2.1 AA, semantic landmarks, a skip link, visible
focus on everything focusable, and colour never used as the only signal (the demo board and the
privacy labels both carry their meaning in words as well as in hue).

Specific decisions worth knowing before changing them:

- **The App Store button is a `button`, not a link.** The listing does not exist, and a link to `#`
  is a trap for keyboard and screen reader users. It is `aria-disabled`, stays focusable, and
  explains itself when activated.
- **Entrance animations are gated on a `motion-ready` class**, set by an inline script in
  `index.html` only when JavaScript is live and reduced motion is off. Nothing is ever hidden
  waiting for an animation that will not arrive; a five-second fallback reveals everything if the
  bundle fails.
- **The FAQ accordions are gated on a `js` class** for the same reason. With no JavaScript they
  render open.
- **Reduced motion is respected in three layers**: GSAP timelines never run, the Three.js loops draw
  one static frame and stop, and a CSS media block overrides anything missed.
- **Both WebGL canvases are `aria-hidden`** and have text alternatives beside them.
- **The demo board is a real ARIA grid** with roving tabindex and arrow-key navigation, and it
  announces moves through a polite live region — but not focus changes, which a screen reader
  already reads from each cell's label.

## Where the game's data lives

| File | Mirrors |
|---|---|
| `src/lib/blocks.ts` | `BlockColor.swift`, `Theme.swift` — the seven blocks, their patterns, tone offsets and the colour-vision matrices |
| `src/components/BlockTile.tsx` | `PatternShape.swift` — the pattern geometry, redrawn as SVG at the same proportions |
| `src/lib/miniGame.ts` | `Board.swift`, `GameEngine.swift` — placement, line clears, scoring, combo and Zen relief |
| `src/data/site.ts`, `src/data/faq.ts` | The feature set, placement modes and support answers |

`npm run check` verifies the demo board against the app's rules: the scoring formula
(cells + lines² × 10, times the combo), the combo cap, the spoken labels, and the guarantee that the
demo can never dead-end.

## Placeholders

Deliberate, and marked as such on the page:

- No App Store link — every CTA says "Coming soon".
- Testimonials are written as placeholder copy, and the section says so.
- "Watch the Film" opens the described scene list rather than a video that does not exist yet.
- The contact form has no backend; it composes a message in the visitor's own mail client.

## Dependency note

`eslint-plugin-jsx-a11y` has not yet declared ESLint 10 in its peer range, so `npm install` needs
`--legacy-peer-deps`. The plugin itself works correctly under flat config; only the declared range is
stale. The CI workflow installs the same way.

## Images

`public/og-card.png` and `public/apple-touch-icon.png` are generated from the SVG sources in
`scripts/assets/` by `npm run images`. They have to be bitmaps — social crawlers largely ignore an
SVG `og:image`, and iOS ignores an SVG touch icon — but the sources stay as SVG so they remain
reviewable in a diff.
