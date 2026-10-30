import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const getExportTargets = value => {
  if (typeof value === 'string') return [value]
  if (!value || typeof value !== 'object') return []
  return Object.values(value).flatMap(getExportTargets)
}

const isPackageEntry = filename => {
  let directory = path.dirname(filename)
  while (true) {
    const manifest = path.join(directory, 'package.json')
    if (existsSync(manifest)) {
      try {
        const pkg = JSON.parse(readFileSync(manifest, 'utf8'))
        const relative = `./${path.relative(directory, filename).split(path.sep).join('/')}`
        return getExportTargets(pkg.exports).some(target => {
          if (!target.startsWith('./')) return false
          const pattern = target.split('*').map(RegExp.escape).join('.*')
          return new RegExp(`^${pattern}$`).test(relative)
        })
      } catch {
        return false
      }
    }
    const parent = path.dirname(directory)
    if (parent === directory) return false
    directory = parent
  }
}

export default {
  meta: {
    type: 'suggestion',
    schema: [],
    messages: {
      wildcard:
        'Prefer export * for this internal barrel. Check name collisions and unintended exports before changing it.'
    }
  },
  create: context => ({
    Program: node => {
      if (
        !node.body.length ||
        !node.body.every(
          item =>
            ['ExportNamedDeclaration', 'ExportAllDeclaration'].includes(
              item.type
            ) && item.source
        )
      )
        return
      const exports = node.body.filter(
        item =>
          item.type === 'ExportNamedDeclaration' &&
          item.source.value.startsWith('.') &&
          item.specifiers.length &&
          !item.specifiers.some(
            specifier =>
              specifier.local?.name === 'default' ||
              specifier.local?.name !== specifier.exported?.name
          )
      )
      if (!exports.length || isPackageEntry(context.physicalFilename)) return
      for (const item of exports) {
        context.report({ node: item, messageId: 'wildcard' })
      }
    }
  })
}
