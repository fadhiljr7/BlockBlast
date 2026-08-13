# Block Blast — Website

The marketing site for **Block Blast: Accessible Edition**, the iOS puzzle game in the
[parent repository](../README.md). Three pages, no build step, no framework, no image assets —
every block, pattern, phone mockup and social card on the site is CSS or inline SVG.

**Live:** https://fadhiljr7.github.io/BlockBlast/

---

## Running it

The site is plain static files. Any static server will do:

```bash
cd blockblastweb
python3 -m http.server 8000     # → http://localhost:8000
# or
npx serve .
```

Open the folder's `index.html` directly and it mostly works, but use a server: the ES module
that loads the 3D hero needs a real HTTP origin.

There is nothing to install, nothing to compile, and no `package.json` on purpose.

## Structure

```
blockblastweb/
├── index.html        Landing page (nine sections), with critical CSS inlined
├── support.html      Support / help — written for App Store reviewers too
├── privacy.html      Privacy policy
├── 404.html          On-brand not-found page
├── manifest.json     PWA manifest for "Add to Home Screen"
├── favicon.svg       SVG favicon, adapts to light and dark
├── css/
│   └── styles.css    The whole design system
├── js/
│   ├── i18n.js               Language switching (EN ⇄ ID), persisted
│   ├── accessibility.js      Nav, drawer, colour-vision filters, form, focus
│   ├── gsap-animations.js    Scroll and entrance motion
│   └── three-hero.js         The floating-blocks hero scene
└── assets/
    └── og-card.svg   Social sharing card (SVG, generated in-repo)
```

GSAP and Three.js load from jsDelivr, pinned to exact versions. They are the only third-party
code on the site, and the page is fully readable and usable if either fails to load.

## How it is put together

**The design system** lives in the `:root` block of `css/styles.css`. Colours, radii, spacing
and easing are all tokens; change one there and it propagates everywhere.

**The palettes are real.** The six theme previews and the pattern demo use the actual colour
values from the iOS app's `Theme.swift`, converted to hex, and the seven patterns are the same
seven the game draws — dots, horizontal stripes, vertical stripes, crosshatch, diagonals,
checkerboard, waves. Each pattern is a CSS gradient tinted with `color-mix()` to a darker tone
of its own block, so it stays visible on a pale pastel block and a near-black one alike.

**The colour-blindness simulator** in the accessibility section applies the same
Brettel/Viénot matrices the app uses, injected as SVG `feColorMatrix` filters by
`accessibility.js`.

### Language switching

English lives in the HTML and is the source of truth, so the site is complete and readable
with JavaScript disabled. Indonesian lives in the `ID` dictionary at the top of `js/i18n.js`.

Two mechanisms, chosen per content type:

| Content | Mechanism |
| --- | --- |
| Short UI strings | `data-i18n="key"` on the element, plus `data-i18n-aria` / `data-i18n-placeholder` for attributes |
| Long-form prose (support, privacy) | Both languages in the markup as `<div data-lang-block="en">` / `<div data-lang-block="id">`, toggled with `hidden` |

The choice is stored in `localStorage` under `bb-lang`, persists across pages, updates
`<html lang>`, and fires a `bb:langchange` event that the hero animation listens for.
First-time visitors get Indonesian automatically if their browser language starts with `id`.

### Motion

`gsap-animations.js` sets every initial state **in JavaScript, never in CSS**. If the GSAP CDN
fails, nothing is left invisible — elements simply stay where they already are. All motion sits
inside a `gsap.matchMedia()` block gated on `prefers-reduced-motion: no-preference`; the reduce
branch clears transforms and shows everything. Stats counters run in both modes, because a
number landing on its value is information rather than decoration.

One deliberate departure from the usual advice: section reveals animate `opacity`, not
`autoAlpha`. `autoAlpha` also sets `visibility: hidden`, which removes elements from the
accessibility tree — a screen-reader user browsing by headings would find whole sections
missing until someone scrolled past them. axe-core flags it as a heading-order break.

The themes carousel pins and scrubs horizontally on desktop only. Below 900px it is a native
scroll-snap scroller, focusable with a keyboard.

### The hero scene

Twelve `BoxGeometry` cubes on a loose 8×8 grid, in the game's palette, lit by an ambient fill,
a shadow-casting key light and a coral rim. Three.js is fetched with a dynamic `import()` that
only fires once the hero is on screen **and** the browser is idle, so roughly a megabyte of
library never competes with first paint. The render loop pauses when the hero scrolls away or
the tab is hidden, and everything is disposed on `pagehide`.

Under reduced motion it renders a single static frame. If WebGL is unavailable, the canvas
removes itself and the hero text is unaffected.

## Accessibility

The site is built to the same standard as the game it advertises.

- WCAG 2.1 AA. Verified with **axe-core: zero violations** on all four pages, at desktop and
  mobile widths, in both languages, including a pass with every scroll animation revealed and a
  pass under `prefers-reduced-motion`.
- Contrast is checked, not assumed: white on the brand coral `#E94560` is only 3.83:1, so
  filled buttons use `--primary-strong: #D43F57` (4.52:1). The brand coral stays for accents,
  where it is 5.12:1 against the background.
- Semantic landmarks, a skip link, visible 2px focus rings, a keyboard-accessible carousel, and
  a focus-trapped mobile drawer that restores focus on close.
- `prefers-reduced-motion`, `prefers-reduced-transparency` and `prefers-contrast` are all
  honoured, plus a print stylesheet that drops the 3D scene and prints every language block.

## Performance

Lighthouse on `index.html`, mobile preset:

| Metric | Score |
| --- | --- |
| Performance | 99 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

Cumulative Layout Shift is 0. Getting there meant abandoning one common trick: the
`rel="preload"` + `onload` async-CSS swap re-flowed the hero headline after first paint, worth a
0.709 CLS penalty. A single ordinary `<link>` costs less than the shift it avoids.

The remaining point comes from compression and cache headers, which the host supplies.

## Deployment

Pushing to `main` with changes under `blockblastweb/` triggers
[`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml), which checks the
expected files exist and publishes the folder to GitHub Pages. It can also be run by hand from
the Actions tab.

Repository settings → Pages → **Source: GitHub Actions** must be set once, or the workflow will
fail at the deploy step.

### Moving to a custom domain

1. Add a `CNAME` file containing the domain to `blockblastweb/`.
2. Change `<base href="/BlockBlast/">` in `404.html` to `<base href="/">`.
3. Update the absolute `og:url`, `og:image`, `twitter:image` and `canonical` values in
   `index.html`.

## Before launch

- [ ] Replace the placeholder addresses `support@blockblast.app` and `privacy@blockblast.app`
      in `support.html` and `privacy.html`.
- [ ] Point the App Store buttons at the real listing and drop their `aria-disabled` attributes
      and the "Coming Soon" tooltip.
- [ ] Replace the "Who we design for" quotes with real beta feedback. They are written as design
      commitments rather than testimonials precisely so that nothing on the page pretends to be a
      user review before there are users.
- [ ] Wire the notify form to a real endpoint, or remove it. Today it validates in the browser
      and stores nothing — and the privacy policy says exactly that.
