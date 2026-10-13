# CI

---

- sync: ci
- version: 2026-10-13-00:00
- @vx/fe-kit: 26.0.0-alpha.1

## Code audits

QA runs Fallow and React Doctor in parallel with the other checks. Both tools
must meet the configured `minimumScore`; lower or unavailable scores fail the
audit job. Both tools run even if one fails.

See [Code audits](audits.md) for commands, configuration, dependency exceptions,
coverage settings, scores, and reports.
