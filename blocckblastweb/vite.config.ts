import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves this as a *project* site, so every asset and route needs
// the repository name in front of it. Any host that serves the site from the
// root of a domain — Netlify, Vercel, a custom domain on Pages — needs `/`
// instead, or the browser asks for /BlockBlast/assets/… and gets nothing.
//
//   BASE_PATH=/ npm run build   →  root-hosted build (also: `npm run build:root`)
//   npm run build               →  GitHub Pages build
//
// Netlify sets NETLIFY=true in its build image, so a CI build there picks the
// right base without anyone having to remember this.
const base = process.env.BASE_PATH ?? (process.env.NETLIFY ? '/' : '/BlockBlast/')

/**
 * GitHub Pages has no SPA rewrite, so a hard refresh on /support would 404.
 * Pages serves 404.html for any unmatched path, and an identical copy of
 * index.html there hands the URL back to the router.
 */
function spaFallback(): Plugin {
  return {
    name: 'spa-404-fallback',
    apply: 'build',
    closeBundle() {
      const index = resolve(import.meta.dirname, 'dist/index.html')
      if (existsSync(index)) copyFileSync(index, resolve(import.meta.dirname, 'dist/404.html'))
    },
  }
}

export default defineConfig(({ command }) => ({
  // Only the built site lives under the repository path; the dev server stays
  // at the root so `npm run dev` opens where you expect it to.
  base: command === 'build' ? base : '/',
  plugins: [react(), tailwindcss(), spaFallback()],
  build: {
    rollupOptions: {
      output: {
        // Three and GSAP are the two heavy dependencies; splitting them keeps
        // the entry bundle small and makes it obvious in the build output if
        // either one grows.
        manualChunks(id: string) {
          if (id.includes('node_modules/three')) return 'three'
          if (id.includes('node_modules/gsap')) return 'gsap'
          return null
        },
      },
    },
  },
}))
