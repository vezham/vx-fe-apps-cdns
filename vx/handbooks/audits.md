# Code Audits

Run `pnpm nx run @vx:@vx-ws/audit` to run the pinned Fallow and React Doctor versions.
Reports, logs, and a combined summary are written to `test-output/audit/`.
QA runs this in parallel with the other checks. Both tools must complete with
the configured `minimumScore`; lower or unavailable scores fail the audit job.
Both tools run even if one fails.

The Fallow gate uses `averageMaintainability`, recorded explicitly as
`scoreMetric` in `summary.json`. The separate overall `healthScore` is included
in reports and logs for information; it is not the gated score. Overall health
also penalizes long functions and Git-history hotspots.

The shared `summary-audit` action also publishes counts by category in the job
summary and separate Fallow and React Doctor commit comments on every QA run.
Each tool keeps a separate comment per commit and workflow. Reruns update the
managed comment; older runs and attempts cannot replace a newer recorded result.
Historical comments from the previous implementation remain unchanged. Fallow includes its local average
maintainability score; React Doctor requests its score from its external scoring
API using diagnostic data. Unavailable scores are shown explicitly. These counts do not depend on the
artifact remaining available. Missing or failed audits are shown explicitly.
Commit comments require `contents: write`; commenting failures do not block QA.
Scores below the recorded `minimumScore` show Failed; missing or invalid scores
show Unavailable and cannot pass the gate. Overall health remains informational.
Each summary includes its timestamp, attempt and workflow run link.
QA checkouts use `github.sha` to keep the audited code and commented commit aligned.
The audit job serializes writes for the same workflow and SHA.

`.fallowrc.jsonc` and `doctor.config.json` exclude generated output, caches,
vendored files, and declarations. Intentional app-template and mock duplication
is excluded only from duplication checks. Framework entry points and targeted
false positives are configured separately so authored code remains covered.
React Doctor supply-chain API calls remain disabled.

This workspace consumes published `@vezham/*` packages from npm. Fallow analyzes
workspace-owned code and configuration; it does not require local public-package
source exports or builds. The shared stylesheet roots under `packages/vx/styles`
are explicit entry points because generated apps import them directly. Their
`@vezham/start/styles/docs` import resolves through the installed package's CSS
export.

Keep Next.js in the root development dependencies in both the source workspace
and workspace-only template. Current Nx build and start commands use the full
workspace installation; Next apps using production-only installations must
declare their own runtime dependency.

Review findings before adding suppressions. Do not add these audits to the
formatter; QA enforces the reviewed `minimumScore` baseline.

`@vezham/start` keeps component implementations separate from configuration
factories, route helpers, and layout/page registries so Fast Refresh can track
component exports. Public entry points re-export these modules with the existing
package subpaths and export names. Preserve those entry points when reorganizing
implementations instead of suppressing mixed-export warnings.

Preview Fallow's suggested cleanup with `pnpm exec fallow fix --dry-run` before
applying individual fixes. Confirm actual runtime, CSS, CLI, and optional peer
usage first: an unused-dependency suggestion alone is not proof a package can
be removed. Keep framework entry points and content collections registered in
`.fallowrc.jsonc` so their imports remain reachable during analysis.

The Fallow dependency exceptions cover these indirect uses:

- `@fontsource/inter` and `@fontsource/jura`: OG font files loaded with
  `require.resolve`; `@vezham/styles-v3`: imported from the shared CSS entry.
- The required peers of `@vezham/react-pro-v3` and `@vezham/react-v3`: HeroUI,
  React Aria/Stately, date utilities, motion, panels, and Tailwind merge are
  supplied at the root for published UI packages. Keep the React Aria versions
  aligned as described in the CLI template baseline.
- The listed Pro optional peers: retained for the workspace's component demos
  and supported component features; review them when `@vezham/react-pro-v3`
  changes or those features are removed.
- `framework.toolingDependencies`: Nx-loaded ESLint configurations/plugins,
  the SWC loader and external helpers, TypeScript's `importHelpers`, config
  loading through Jiti, and the existing workspace CLI commands.
- Root-declared dependencies used by private workspace packages: this workspace
  installs them centrally instead of repeating declarations in each package.
  The exact names in `ignoreDependencies` were checked against the root manifest.
- `@testing-library/jest-dom`: the shared Vitest setup imports matchers from the
  root development dependency. Keep that declaration at the root.
- `@vezham/react-v2`: intentionally retained as a build-time demo dependency.
  Revisit its placement if deployment starts installing production dependencies
  to execute code that imports it directly.

Use exact package names. `ignoreDependencies` suppresses both unused and
unlisted dependency findings, so keep these packages declared and review the
exceptions alongside dependency updates. Tool-only dependencies belong in
`framework.toolingDependencies` instead.

The root dependencies include `@vezham/start` because the shared docs stylesheet
imports its CSS export from outside an application package.

Fallow's average maintainability score also includes a penalty for each file's
number of imports. It is not a percentage of resolved findings; removing all
reported issues does not guarantee a score of 100.

Coverage enforcement is deferred while the workspace is a POC and CLI base.
Fallow sets `health.maxCrap` to `0` to disable coverage-based risk findings and
`rules.coverage-gaps` to `off`. Complexity and long-function findings remain
enabled. Fallow may still display estimated coverage and risk metrics; disabling
enforcement does not change the overall health score's fixed calibration.

The audit target depends on `test:eslint` and `test:audit`. The first runs the
lint-rule tests and generates a c8 coverage report; the second runs the audit
gate and runner regression tests. A test failure blocks the audit. Run them
separately with `pnpm nx run @vx:test:eslint` or `pnpm nx run @vx:test:audit`.
Fallow registers these Node test files as entry points because the CLI discovers
them outside the application import graph. Fallow does not
consume the coverage report while coverage enforcement is disabled. When
reintroducing enforcement, restore the report path and an appropriate risk
threshold.

The restoration TODO and previous coverage setting are kept beside `health` in
`.fallowrc.jsonc`. The separate `coverage-gaps` rule can remain off until its
findings are reviewed.

The small `dot-notation.mjs` rule remains together: its dependents include test
files, so the "split high-impact file" recommendation alone does not justify
splitting it. Keep this advisory visible rather than excluding the file from
health analysis. Boundary and policy checks require explicit configuration and
are not currently measured by this audit.
