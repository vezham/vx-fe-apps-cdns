import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const directory = path.dirname(fileURLToPath(import.meta.url))
const runAudit = (t, tools) => {
  const root = mkdtempSync(path.join(tmpdir(), 'vx-audit-runner-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const scripts = path.join(root, 'vx/tools/audit')
  const bin = path.join(root, 'bin')
  mkdirSync(scripts, { recursive: true })
  mkdirSync(bin)
  mkdirSync(path.join(root, 'test-output/audit'), { recursive: true })
  for (const file of ['index.mjs', 'gate.mjs'])
    copyFileSync(path.join(directory, file), path.join(scripts, file))
  writeFileSync(path.join(root, 'tools.json'), JSON.stringify(tools))
  writeFileSync(
    path.join(root, 'test-output/audit/fallow.json'),
    JSON.stringify({
      kind: 'combined',
      health: { summary: { average_maintainability: 100 } }
    })
  )
  writeFileSync(
    path.join(bin, 'fake.cjs'),
    `
    const fs = require('node:fs')
    const tools = JSON.parse(fs.readFileSync('tools.json'))
    const name = process.argv[3]
    const tool = tools[name]
    fs.appendFileSync('calls.txt', name + '\\n')
    const flag = name === 'fallow' ? '--output-file' : '--json-out'
    const output = process.argv[process.argv.indexOf(flag) + 1]
    if (!tool.noReport) fs.writeFileSync(output, tool.invalid ? '{broken' : JSON.stringify(name === 'fallow' ? {kind:'combined',health:{summary:{average_maintainability:tool.score},health_score:{score:55}},check:{summary:{total_issues:3}}} : {ok:true,summary:{score:tool.score,errorCount:0,warningCount:0,affectedFileCount:0}}))
    process.exitCode = tool.exitCode || 0
  `
  )
  writeFileSync(
    path.join(bin, 'pnpm'),
    `#!/bin/sh\nexec "${process.execPath}" "${path.join(bin, 'fake.cjs')}" "$@"\n`,
    { mode: 0o755 }
  )
  const result = spawnSync(
    process.execPath,
    [path.join(scripts, 'index.mjs')],
    {
      cwd: root,
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
      encoding: 'utf8'
    }
  )
  assert.equal(result.error, undefined)
  assert.deepEqual(
    readFileSync(path.join(root, 'calls.txt'), 'utf8').trim().split('\n'),
    ['fallow', 'react-doctor']
  )
  return {
    result,
    reports: JSON.parse(
      readFileSync(path.join(root, 'test-output/audit/summary.json'), 'utf8')
    )
  }
}

test('runner records the threshold and passes both tools at the required score', t => {
  const { result, reports } = runAudit(t, {
    fallow: { score: 90 },
    'react-doctor': { score: 100 }
  })
  assert.equal(result.status, 0, result.stderr)
  assert.ok(
    reports.every(report => report.minimumScore === 90 && report.passed)
  )
})

test('below-threshold findings fail while the other tool still runs', t => {
  const { result, reports } = runAudit(t, {
    fallow: { score: 70, exitCode: 1 },
    'react-doctor': { score: 100 }
  })
  assert.equal(result.status, 1)
  assert.equal(reports[0].completed, true)
  assert.equal(reports[0].passed, false)
  assert.equal(reports[1].passed, true)
})

test('missing scoring API result fails the gate', t => {
  const { result, reports } = runAudit(t, {
    fallow: { score: 100 },
    'react-doctor': { score: null }
  })
  assert.equal(result.status, 1)
  assert.equal(reports[1].passed, false)
})

test('failed report generation clears old reports rather than publishing stale success', t => {
  const { result, reports } = runAudit(t, {
    fallow: { noReport: true, exitCode: 2 },
    'react-doctor': { score: 100 }
  })
  assert.equal(result.status, 1)
  assert.equal(reports[0].completed, false)
  assert.equal(reports[0].passed, false)
  assert.equal(reports[1].passed, true)
})

test('scores outside the valid range cannot pass the runner', t => {
  const { result, reports } = runAudit(t, {
    fallow: { score: 110 },
    'react-doctor': { score: 100 }
  })
  assert.equal(result.status, 1)
  assert.equal(reports[0].passed, false)
})
