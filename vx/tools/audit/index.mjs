import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { auditPassed } from './gate.mjs'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = path.join(root, 'test-output/audit')
const minimumScore = 90
mkdirSync(output, { recursive: true })

const audits = [
  {
    name: 'fallow',
    args: [
      '--score',
      '--format',
      'json',
      '--output-file',
      path.join(output, 'fallow.json')
    ]
  },
  {
    name: 'react-doctor',
    args: [
      '--yes',
      '--no-supply-chain',
      '--json',
      '--json-out',
      path.join(output, 'react-doctor.json')
    ]
  }
]
const results = []
for (const audit of audits) {
  const report = path.join(output, `${audit.name}.json`)
  // vx-bot/NOTE: Clear prior output so a failed run cannot publish a stale report.
  writeFileSync(report, '')
  const run = spawnSync('pnpm', ['exec', audit.name, ...audit.args], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    timeout: 8 * 60 * 1000
  })
  writeFileSync(
    path.join(output, `${audit.name}.log`),
    `${run.stdout ?? ''}\n${run.stderr ?? ''}\n${run.error?.message ?? ''}`
  )
  let completed = false
  try {
    const data = JSON.parse(readFileSync(report, 'utf8'))
    completed =
      !run.error &&
      [0, 1].includes(run.status) &&
      (audit.name === 'fallow' ? data.kind === 'combined' : data.ok === true)
    results.push({
      tool: audit.name,
      completed,
      exitCode: run.status,
      scoreMetric:
        audit.name === 'fallow' ? 'averageMaintainability' : 'reactDoctor',
      score:
        audit.name === 'fallow'
          ? (data.health?.summary?.average_maintainability ?? null)
          : (data.summary?.score ?? null),
      ...(audit.name === 'fallow'
        ? { healthScore: data.health?.health_score?.score ?? null }
        : {}),
      summary: data.summary ?? data.check?.summary
    })
  } catch {
    results.push({ tool: audit.name, completed: false, exitCode: run.status })
  }
  console.log(
    `${audit.name}: ${completed ? 'report ready' : 'audit failed'} — ${report}`
  )
}
for (const result of results) {
  result.minimumScore = minimumScore
  result.passed = auditPassed(result)
}
writeFileSync(
  path.join(output, 'summary.json'),
  `${JSON.stringify(results, null, 2)}\n`
)
for (const result of results) {
  if (!result.completed) {
    process.exitCode = 1
    continue
  }

  console.log(
    `${result.tool}: ${result.scoreMetric} ${result.score ?? 'unavailable'}` +
      (result.tool === 'fallow'
        ? `; overall health ${result.healthScore ?? 'unavailable'} (informational)`
        : '')
  )

  if (!result.passed) {
    console.error(
      `${result.tool}: ${result.scoreMetric} ${result.score ?? 'unavailable'} does not meet the required ${minimumScore}/100 score gate`
    )
    process.exitCode = 1
  }
}
