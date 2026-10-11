import { defineConfig } from '@vx/config/playwright'

export default defineConfig(__filename, {
  webServer: {
    command: 'pnpm exec nx run static-cdn:preview'
  }
})
