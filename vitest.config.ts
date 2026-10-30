import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadConfigFromFile, mergeConfig } from 'vite'
import { parse } from 'yaml'

import { type ViteConfig, getProjectPackageName } from '@vezham/config/vite'
import {
  defineConfig,
  defineFrameworkTestConfig,
  validateFramework
} from '@vezham/config/vitest'

const configFile = fileURLToPath(import.meta.url)

const findProjectConfig = () => {
  const projectRoot = process.cwd()
  const candidates = [
    'vitest.config.ts',
    'vitest.config.mts',
    'vitest.config.js',
    'vitest.config.mjs'
  ]

  return candidates
    .map(candidate => path.resolve(projectRoot, candidate))
    .find(candidate => candidate !== configFile && existsSync(candidate))
}

export default defineConfig(async env => {
  const baseConfig = {
    resolve: {
      tsconfigPaths: true
    },
    test: {
      name: getProjectPackageName(),
      watch: false,
      globals: true,
      environment: 'node',
      // vx-bot/NOTE: Transform installed packages so import.meta.env and mocks use Vite's module runner.
      server: {
        deps: {
          inline: [
            '@vezham/start',
            '@vezham/env',
            '@vezham/react',
            '@vezham/template',
            '@vezham/devtools',
            '@vezham/hooks',
            '@vezham/utils'
          ]
        }
      },
      include: [
        '{src,tests,__tests__}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
      ],
      reporters: ['default'],
      coverage: {
        reportsDirectory: './test-output/vitest/coverage',
        provider: 'v8' as const
      }
    }
  } satisfies ViteConfig

  const appConfigFile = path.resolve(process.cwd(), 'vx.app.yaml')
  let defaults: ViteConfig = baseConfig
  if (existsSync(appConfigFile)) {
    const framework = validateFramework(
      parse(readFileSync(appConfigFile, 'utf8')).framework
    )
    const preset = defineFrameworkTestConfig(framework)
    const resolved =
      typeof preset === 'function' ? await preset(env) : await preset
    defaults = mergeConfig(baseConfig, resolved)
  }
  const projectConfigFile = findProjectConfig()

  if (!projectConfigFile) {
    return defaults
  }

  const loadedProjectConfig = await loadConfigFromFile(
    {
      command: 'serve',
      mode: 'test',
      isSsrBuild: false,
      isPreview: false
    },
    projectConfigFile,
    process.cwd()
  )
  const projectConfig = loadedProjectConfig?.config ?? {}
  return mergeConfig(defaults, projectConfig) as ViteConfig
})
