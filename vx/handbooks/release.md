# Release Versioning

This handbook documents how Vx app and package versions are managed.

## Version Shape

Use SemVer with a yearly major release line:

```text
27.0.0-alpha.1
27.0.0-beta.1
27.0.0
27.1.0
27.1.1
28.0.0-alpha.1
```

- Major: yearly/platform generation.
- Minor: feature release train inside that generation.
- Patch: fixes, chores, refactors, docs, tests, and maintenance releases.
- Prerelease: alpha, beta, or rc artifact trains.

## Runtime Flags

Keep artifact version and runtime behavior separate.

```env
V_APP_ID=vezham-example
V_APP_NAME=Vezham Example
V_APP_VER=27.0.0-alpha.1
V_APP_ENV=production
V_RELEASE_CHANNEL=stable
```

- `V_APP_VER` identifies the artifact.
- `V_APP_ENV` identifies deployment: `local`, `dev`, `qa`, `preview`, or `production`.
- `V_RELEASE_CHANNEL` selects the independent runtime channel: `canary`, `beta`, or `stable`.

`V_APP_ID`, `V_APP_NAME`, and `V_APP_VER` are required by `@vezham/env`.
Metadata generation supplies identity and version from `vx.app.yaml`.
`V_APP_ENV` defaults to `local` when absent or empty, independently of build mode.
Reference app configs omit it; deployments must explicitly set and validate their
target environment. Set it before building and before starting servers that read
configuration at runtime. Metadata generation preserves this deployment setting.

Do not infer the release channel from the version string. A beta rollout can run
a stable artifact, and a production deployment can temporarily run a prerelease
artifact. Use `RELEASE_CHANNEL === 'beta'` for beta-channel behavior.
`V_RELEASE_CHANNEL` is the only release-channel input; when absent or empty,
it defaults to `stable`.

### Application Usage

Vite reads these settings from `import.meta.env` using the workspace's `V_`
prefix. Import the validated values through the Vite adapter:

```ts
import { APP_ENV, RELEASE_CHANNEL } from '@vezham/env/vite'
```

Next reads settings from `process.env`. Application code imports validated values
from `@vezham/env/next`. In `next.config.ts`, use the configuration-only entry:

```ts
import { configEnv } from '@vezham/env/next/config'
```

This exposes public configuration without initializing runtime validation during
Nx project discovery.

### Validation

Missing, empty, or whitespace-only `V_APP_ID`, `V_APP_NAME`, or `V_APP_VER` values
throw during runtime module initialization. Invalid non-empty `V_APP_ENV` or
`V_RELEASE_CHANNEL` values also throw, including whitespace-only values and
unrecognized casing. Defaults apply only when those settings are absent or empty;
there is no `unknown` environment or placeholder app identity/version.

### Build Mode

`__DEV__` is true when Vite `MODE` or Next `NODE_ENV` is `development`.
`__PRODUCTION__` is true when that value is `production`. These flags describe
build mode independently of deployment; a production build can run in `dev`,
`qa`, or `preview`, and a local production build still defaults to `APP_ENV=local`.
Compare `APP_ENV` directly with `qa` or `preview` for deployment behavior, and
`RELEASE_CHANNEL` with `beta` for beta-channel behavior.

## App Version Sync

Main apps keep these files in sync:

```text
<apps-category>/<app>/package.json
<apps-category>/<app>/vx.app.yaml
<apps-category>/<app>/.env
```

`<apps-category>` can be any app category generated or managed by
`@vx-cli/react`, such as `apps-internals`, `apps-cdns`, `apps`, or another
workspace app grouping.

The workspace release entry point is `pnpm nx run @vx:@vx-ws/release`. It uses
Nx's release APIs and a custom version action configured in `nx.json`:

```json
"versionActions": "./vx/tools/release/version-actions.cjs"
```

That action extends Nx's JavaScript release behavior:

- Nx updates `package.json`.
- Vx additionally updates `vx.app.yaml` at `core.version` when the project
  has a Vx config file.
- After versioning, the release runner invokes the metadata CLI to sync `.env`
  keys such as `V_APP_VER` and other generated metadata from `vx.app.yaml`.
  Tracked outputs are included in the changelog's release commit before tagging.

## Release Commands

The release runner versions workspace projects, synchronizes metadata, and
generates the changelog, then publishes projects in the version result that have
an `nx-release-publish` target. When all release projects are private and have no
publish target, npm publishing is
skipped. Keep private packages private unless they are intentionally made public.

Versioning and changelogs use the fixed workspace release group. Publishing uses
a separate `ReleaseClient` containing only eligible public projects, with
`ignoreNxJsonConfig: true` (the second constructor argument). Filtering the
workspace's fixed group directly is rejected by Nx, even during a dry run.

Release builds use `@vx:@vx-ci/build`, with up to four build tasks running at once.

Use the workspace runner for complete releases, including metadata synchronization.
Direct `pnpm nx release` commands use Nx's configured version action but bypass
the runner's post-version metadata step and separate public-project publish group.

Use explicit major bumps for yearly generation changes:

```sh
pnpm nx run @vx:@vx-ws/release -- --version=major
```

Use conventional commits for normal minor/patch releases:

```sh
pnpm nx run @vx:@vx-ws/release
```

Use explicit prerelease versions for alpha or beta trains. For example, when the
latest release is `26.0.0-alpha.3`:

```sh
pnpm nx run @vx:@vx-ws/release -- --version=26.0.0-alpha.4
pnpm nx run @vx:@vx-ws/release -- --version=26.0.0-beta.1
```

The runner accepts `version`, `firstRelease`, `dryRun`, and `verbose`; it does not
expose Nx's `preid` option. The examples above are alternative release choices.

Preview a release from a disposable checkout:

```sh
pnpm nx run @vx:@vx-ws/release -- --version=26.0.0-alpha.4 --dryRun
```

Dry runs skip version/changelog writes, Git release operations, and npm uploads,
but still execute the pre-version build hook. That build can write generated files.

The runner publishes with `access: public` and does not select an npm dist-tag.
With the current registry configuration, publishing uses `latest`, including for
alpha and beta versions. The version suffix does not select a separate npm tag
or runtime release channel.

## Conventional Commits

Use `<type>(<scope>): <subject>` for every commit header. Scope rules:

- Use the normalized Nx project name for a project-specific change, such as
  `start` for `@vezham/start`.
- When normalized names collide, use the full Nx project name. For example,
  `fix(@vx-cli/react): use hyphens in app category paths` identifies the CLI,
  and `fix(@vx/react): update workspace components` identifies the local package.
  Commitlint rejects the ambiguous short scope `react` and lists the full names.
- For changes affecting two or three projects, use distinct comma-separated
  scopes without spaces and sort them alphabetically, such as
  `fix(env,start): use generated app version`.
- Use no more than three scopes. Use `repo` or `workspace` alone for broader
  changes; never combine either one with another scope.

Nx checks every commit since the previous release. Adding a new commit with a
unique scope does not fix an ambiguous scope already in that history. For an
already-pushed ambiguous commit, dispatch the next release with an explicit
version (for example, `26.0.0-beta.4` after `26.0.0-beta.3`). Automatic version
selection can resume after that release establishes the next tag.

The release config maps commit types like this:

- `feat`: minor
- `fix`: patch
- `build`: none
- `release`: none
- all other allowed commitlint types: patch

Current patch-default types:

- `chore`
- `ci`
- `deps`
- `docs`
- `i18n`
- `mocks`
- `perf`
- `refactor`
- `revert`
- `stories`
- `style`
- `test`

Yearly major bumps should be intentional release commands, not ordinary commit
types.

## Support Apps

Mock and e2e apps use stable workspace ids:

```env
V_APP_ID=play-start-mock
V_APP_ID=play-start-e2e
```

An id alone is enough for standalone mock/e2e tooling that does not load `@vezham/env`.
Any support app using `@vezham/env` must also supply `V_APP_NAME` and `V_APP_VER`, like
other apps.

## Package release workflow

The active `.github/workflows/release.yml` owns scheduled and manual npm releases.
It does not run on `release: published`, because the release command itself creates
the version commit, tag and GitHub release. Normal publishing runs only from the
default branch; manual dry runs may use other branches. Releases share a single
concurrency group across refs so two runs cannot publish the same package concurrently.

Non-dry runs require the latest QA run for the triggering SHA and branch to have
succeeded. Checkout then uses the branch name so Nx can commit and push. The
branch can advance after the SHA check; the workflow currently does not recheck
QA against the checked-out HEAD.

The shared npm setup selects Node from root `package.json`, matching
[QA](./ci.md#node-runtime). `engines.node: "24.x"` keeps the runtime on Node 24;
an explicit `NODE_VERSION` input or matrix version takes precedence. pnpm uses
the manifest `packageManager` version. Publishable package repository metadata
must match the actual source repository for npm provenance.

The shared `vx-deployer` Nx release action owns provenance configuration through
its `NPM_PROVENANCE` input. It sets both `NPM_CONFIG_PROVENANCE` for npm-compatible
publishers and `PNPM_CONFIG_PROVENANCE` for pnpm. pnpm 12 callers must use 12.14.0
or newer; 12.3.4 ignores the publish setting. Packages retain Nx's default inferred
publish target without a PATH adapter or package-specific wrapper. Nx preserves
dry-run and publish options, and signing failures fail the release task. Provenance
also requires a public source repository, a supported hosted runner, and
`id-token: write`, which the workflow grants. A dry run cannot verify signing;
after publishing, check the exact version with
`npm view @vezham/react@<version> dist.attestations --json`. Registry signatures
alone do not confirm build provenance. See the
[shared action README](https://github.com/vezham/vx-deployer/blob/timeline/.github/actions/nx/release/README.md)
for setup requirements and input details.

The Nx `release.version.preVersionCommand` is the only release build stage. Both
`@vx-ws/release` and the workflow delegate to it. `test:release` verifies orchestration
using mocked Nx release APIs, without authenticating or publishing.
The build runs before the version changes; post-version metadata synchronization
does not rebuild compiled artifacts. Deployments must build from the release
commit to embed the updated app metadata.

After versioning and before changelog creation commits and tags the release, the
runner regenerates metadata for changed projects that have `vx.app.yaml`.
It invokes the metadata CLI with `generate <projectRoot> --json` to collect the
generated file paths for staging.
Tracked generated files are staged with the release changes; untracked files,
including ignored local files, are not added. Dry runs skip this post-version
metadata step; the pre-version build can still regenerate metadata. A metadata
generation failure stops the release before the changelog commit and publishing.

For the initial release, manually enable **firstRelease** and provide an explicit
version, for example `0.0.1`. Preview with **dryRun** first. Subsequent runs use
conventional commits and the release tags; leave **firstRelease** disabled. The
schedule cannot bootstrap an untagged repository. The next scheduled run can release
after the initial release is completed.

The release runner writes Nx's resolved workspace version to `release_version`
in `GITHUB_OUTPUT` when a version change is selected, including dry runs. The
shared release action exposes it as `version`; the workflow passes that job output
to the summary as `resolved_version`. Automatic selection displays the version
with `(auto / detected)`, while increments display the resolved version and the
requested increment. No version output is written when there are no changes.

The runner also reports `release_published_count` and `release_publishable_count`.
The shared action exposes them as `published_count` and `publishable_count`, and
the workflow forwards both to the summary's **Packages published** row, such as
`5/8`. The total includes every workspace project with an `nx-release-publish`
target; only changed eligible projects are passed to publishing. The numerator
counts successful Nx publish results, including already-published versions that
Nx skips successfully. Dry runs and no-change runs report zero. If publishing
throws before returning results, the numerator is unknown and displays `—/8`.

The fixed workspace release train uses `releaseTag.strictPreid: false` so normal
releases can resolve an existing alpha or beta tag even without a `preid` option.
Nx's strict default otherwise searches only stable tags when no preid is given.

```sh
pnpm nx run @vx:test:release
pnpm nx run @vx:@vx-ws/release -- --version=0.0.1 --firstRelease --dryRun
```

A dry run previews Nx versioning and publishing operations, but Nx still executes
the pre-version build hook with `NX_DRY_RUN=true`. That build can regenerate local
app files; use a disposable checkout when previewing a release.
Shared action changes must reach `vezham/vx-deployer@timeline` before running the
caller. Existing npm token permissions, repository visibility, branch protection
and GitHub Actions secrets still determine whether the live publish succeeds.
