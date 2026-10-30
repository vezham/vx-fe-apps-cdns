# CI

---

- sync: ci
- version: 2026-10-25-00:00:00
- @vx/fe-kit: 26.0.0-alpha.10

## Node runtime

QA and npm release jobs select Node from root `package.json` through the shared
setup actions' `node-version-file` setting. `engines.node: "24.x"` keeps CI on
Node 24 while allowing patch and minor updates. pnpm uses the manifest's
`packageManager` version. Update the root manifest to change either baseline;
workflow-level `NODE_VERSION` overrides are reserved for explicit exceptions.
The shared QA setup uses Node 24 for older repositories without a manifest Node
declaration. This compatibility fallback does not override a declared version.

## Release summary

The release results include **Packages published** as `published / total publishable`,
for example `5/8`. The denominator includes every workspace project with an
`nx-release-publish` target, including packages outside the selected release.
The numerator counts successful publish results for selected packages with a new
version. Dry runs and no-change runs report `0/8`; unknown publish results display
`—/8`. Nx treats an already-published version as a successful publish result.

The runner writes the counts to `GITHUB_OUTPUT`; the shared release action and
workflow forward them to the shared summary action. Callers without these outputs
keep their existing summary. See [Release](release.md#package-release-workflow).

## Code audits

QA runs Fallow and React Doctor in parallel with the other checks. Both tools
must meet the configured `minimumScore`; lower or unavailable scores fail the
audit job. Both tools run even if one fails.

See [Code audits](audits.md) for commands, configuration, dependency exceptions,
coverage settings, scores, and reports.
