import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2] ?? 'public')
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'catalog-manifest.json'), 'utf8')
)
const rows = JSON.parse(
  fs.readFileSync(path.join(root, 'catalog.json'), 'utf8')
)
if (!['illustrations', 'logos'].includes(manifest.collection))
  throw new Error('Unknown catalog collection')
if (manifest.schemaVersion !== 1 || rows.length !== manifest.entries)
  throw new Error('Catalog manifest does not match its entries')
const slugs = new Set()
let files = 0
const missing = []
for (const row of rows) {
  const [slug, title] = row
  if (!slug || !title || slugs.has(slug) || /[\\/]/.test(slug))
    throw new Error(`Invalid or duplicate catalog entry: ${slug}`)
  slugs.add(slug)
  const paths =
    manifest.collection === 'illustrations'
      ? [`${slug}.svg`]
      : Object.entries(row[6]).map(([variant, url]) => {
          if (
            url !== `https://logos.cdn.vezham.com/assets/${slug}/${variant}.svg`
          )
            throw new Error(
              `Logo URL does not match its asset: ${slug}/${variant}`
            )
          return `${slug}/${variant}.svg`
        })
  for (const file of paths) {
    files++
    const target = path.join(root, 'assets', file)
    if (!fs.existsSync(target) || fs.statSync(target).size === 0)
      missing.push(file)
  }
}
if (files !== manifest.assetFiles || missing.length)
  throw new Error(
    `Catalog/assets mismatch: ${files} referenced files; ${missing.length} missing: ${missing.slice(0, 10).join(', ')}`
  )
console.log(
  JSON.stringify({
    collection: manifest.collection,
    entries: rows.length,
    assetFiles: files,
    missing: 0
  })
)
