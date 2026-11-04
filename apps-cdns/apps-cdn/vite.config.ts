import { nxReadySignal } from '@nx/vite/plugins/nx-ready-signal.plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'

import { defineConfig } from '@vezham/config/presets/cdn'

export default defineConfig({
  root: import.meta.dirname,
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    tailwindcss(),
    react(),
    nxReadySignal()
  ]
})
