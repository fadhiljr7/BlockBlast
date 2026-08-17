import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The site is published to https://fadhiljr7.github.io/BlockBlast/, so every
// asset and route needs the repository name as a prefix. `BASE_PATH=/` builds a
// root-hosted copy (custom domain, or a local preview of that shape).
const base = process.env.BASE_PATH ?? '/BlockBlast/'

export default defineConfig(({ isSsrBuild }) => ({
  base,
  plugins: [react(), tailwindcss()],
  define: {
    // Frozen at build time on purpose. A "last updated" date computed while
    // rendering would differ between the prerendered HTML and the hydrated
    // client, and it would also claim the policy changed on days it did not.
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  build: {
    // Three.js and GSAP are only reachable behind dynamic imports; naming their
    // chunks makes it obvious in the build output if that ever stops being true
    // and they leak into the entry bundle. The SSR build is a single file for
    // the prerenderer to import, so it gets no chunking at all.
    rollupOptions: isSsrBuild
      ? {}
      : {
          output: {
            manualChunks(id: string) {
              if (id.includes('node_modules/three')) return 'three'
              if (id.includes('node_modules/gsap')) return 'gsap'
              return null
            },
          },
        },
  },
}))
