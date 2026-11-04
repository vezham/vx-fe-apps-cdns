import fs from 'node:fs/promises'
import path from 'node:path'

const collection = process.argv[2]
if (!['illustrations', 'logos'].includes(collection))
  throw new Error(
    'Usage: node vx/tools/cdn/sync-assets.mjs illustrations|logos'
  )
const app = path.resolve(
  import.meta.dirname,
  '../../..',
  'apps-cdns',
  `${collection}-cdn`
)
const output = path.join(app, 'public/assets')
const catalog = JSON.parse(
  await fs.readFile(path.join(app, 'public/catalog.json'), 'utf8')
)
const tasks =
  collection === 'illustrations'
    ? catalog.map(([slug]) => ({
        file: `${slug}.svg`,
        url: `https://cdn.reicon.dev/${encodeURIComponent(slug)}.svg`
      }))
    : catalog.flatMap(([slug, , , , , , variants]) =>
        Object.keys(variants).map(variant => ({
          file: `${slug}/${variant}.svg`,
          url: `https://cdn.reicon.dev/logos/${encodeURIComponent(slug)}/${encodeURIComponent(variant)}.svg`
        }))
      )
const workers = Math.min(
  64,
  Math.max(1, Number(process.env.VX_ASSET_CONCURRENCY) || 64)
)
let cursor = 0
let downloaded = 0
let skipped = 0
let bytes = 0
const failures = []
await fs.mkdir(output, { recursive: true })
const started = Date.now()
const progress = () =>
  console.log(
    JSON.stringify({
      done: downloaded + skipped + failures.length,
      total: tasks.length,
      downloaded,
      skipped,
      failed: failures.length,
      megabytes: Math.round(bytes / 1e6),
      seconds: Math.round((Date.now() - started) / 1000)
    })
  )
const timer = setInterval(progress, 10000)
try {
  await Promise.all(
    Array.from({ length: workers }, async () => {
      for (;;) {
        const task = tasks[cursor++]
        if (!task) return
        const file = path.join(output, task.file)
        try {
          if ((await fs.stat(file).catch(() => undefined))?.size > 0) {
            skipped++
            continue
          }
          await fs.mkdir(path.dirname(file), { recursive: true })
          for (let attempt = 0; attempt < 4; attempt++) {
            try {
              const response = await fetch(task.url, {
                signal: AbortSignal.timeout(30000)
              })
              if (!response.ok) throw new Error(`HTTP ${response.status}`)
              const svg = await response.text()
              if (!/<svg[\s>]/i.test(svg) || !/<\/svg\s*>/i.test(svg))
                throw new Error('Invalid SVG response')
              await fs.writeFile(file + '.tmp', svg)
              await fs.rename(file + '.tmp', file)
              bytes += Buffer.byteLength(svg)
              downloaded++
              break
            } catch (error) {
              if (attempt === 3) throw error
              await new Promise(resolve =>
                setTimeout(resolve, 500 * (attempt + 1))
              )
            }
          }
        } catch (error) {
          failures.push({ ...task, error: error.message })
        }
      }
    })
  )
} finally {
  clearInterval(timer)
  progress()
  await fs.writeFile(
    path.join(app, 'public/sync-report.json'),
    JSON.stringify(
      { total: tasks.length, downloaded, skipped, failures },
      null,
      2
    ) + '\n'
  )
}
if (failures.length) process.exitCode = 1
