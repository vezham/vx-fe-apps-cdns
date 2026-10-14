import assert from 'node:assert/strict'
import { test } from 'node:test'

import { auditPassed } from './gate.mjs'

test('scores at or above the required threshold pass', () => {
  assert.equal(
    auditPassed({ completed: true, score: 90, minimumScore: 90 }),
    true
  )
  assert.equal(
    auditPassed({ completed: true, score: 100, minimumScore: 90 }),
    true
  )
})

test('low, missing, invalid scores or thresholds and incomplete reports fail', () => {
  for (const overrides of [
    { score: 89.9 },
    { score: null },
    { score: '100' },
    { score: NaN },
    { score: Infinity },
    { score: 101 },
    { score: -1 },
    { minimumScore: NaN },
    { minimumScore: 101 },
    { completed: false }
  ])
    assert.equal(
      auditPassed({
        completed: true,
        score: 95,
        minimumScore: 90,
        ...overrides
      }),
      false
    )
})
