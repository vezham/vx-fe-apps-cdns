import nx from '@nx/eslint-plugin'

import baseConfig from '../../eslint.config.mjs'

export default [
  ...baseConfig,
  ...nx.configs['flat/react'],
  {
    // vx-bot/NOTE: Service workers access their global scope through self.
    files: ['public/workers/sw.js'],
    rules: { 'no-restricted-globals': 'off' }
  }
]
