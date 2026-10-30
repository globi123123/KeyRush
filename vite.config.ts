import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
  version: string
}

// The app uses hash-based routing, so a relative base path works on any
// GitHub Pages URL (user site or project site). Set BASE_PATH to override,
// e.g. BASE_PATH=/KeyRush/ npm run build
const base = process.env.BASE_PATH || './'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Keep vendor code and the text library in their own cacheable chunks.
        manualChunks(id) {
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/motion-')) return 'motion'
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react'
          if (id.includes('/src/content/')) return 'content'
        },
      },
    },
  },
})
