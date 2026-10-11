import { defineConfig } from '@vx/start/vite'

import { Shell } from '@app/shell'
import { vxI18n } from '@generated/vx'

defineConfig({
  lang: vxI18n.defaultLanguage,
  children: <Shell />,
  query: false
})
