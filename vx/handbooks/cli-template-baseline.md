# CLI App Template Baseline

The internal apps are reference implementations and test beds for future CLI app
creation. The current repository is the reviewed baseline. Keep adding test apps
or scenarios when they help evaluate a framework, hosting preset, or shared Vx
feature; a playground app does not need to be as small as the app the CLI creates.

`vx-fe-kit-next` is the source workspace; changes flow from it into
`vx-fe-kit-next-template`. Implement shared code, exports, and audit configuration
in the source before carrying them into the workspace-only template. When removing
reference apps from the template, also remove their TypeScript project references.
Keep the root Next.js dependency in `devDependencies` in both workspaces. The
current Nx build and start commands use the full workspace installation. A Next
app deployed with a production-only installation must declare `next` as its own
runtime dependency.

## Agreed boundaries

- Keep static shell navigation and toolbar settings in `vx.nav.yaml`; see the
  [Navigation handbook](./navigation.md) for generation and custom code boundaries.

- The CLI will copy only the files required by the selected app type. Do not
  copy an entire playground directory and then remove demos.
- Follow [Application Types and Categories](./application-categories.md) for
  the type-first flow, category filters and order, matching folder and project
  names, and main-group versus dedicated-group placement. Add template role
  suffixes once after name normalization; `--skipSuffix` preserves the supplied
  project name for standalone sites. Keep project identity and E2E names aligned
  with that final name.
- Keep reusable runtime and generation behavior in `@vezham/start` and
  `@vezham/config`. Keep app identity, route intent, and hosting choices in each
  app's `vx.app.yaml` and `vx.deploy.yaml`.
- Seed all generated project manifests (apps, E2E, mocks, and both library types)
  from the consumer repository's
  latest matching SemVer release tag, using the workspace `release.releaseTag`
  pattern, prerelease preference, and branch settings. Read tags from the consumer
  workspace root through the shared `resolveInitialVersion` utility. Fall back
  to the installed `@vx-cli/react` version when Git or
  a matching tag is unavailable. This reads the existing release version without
  calculating a bump or fetching tags. Keep app `package.json`, `vx.app.yaml`
  core version, `.env` `V_APP_VER`, and CDN HTML asset version tags aligned.
  Generated projects manage their own versions after creation.
- Use spaced display names for app metadata and visible text: `playground-app`
  becomes `Playground App` in names, descriptions, titles, and docs content.
  Keep `CDN` uppercase as a display-name word, such as `Playground CDN`.
  Derive IDs, URLs, and file names from the normalized project slug.
- Author app and deploy configuration in YAML. Keep JSON Schema definitions
  and generated provider artifacts in their existing JSON format. Use one
  YAML source per config; no legacy JSON input fallback is required.
- Use [`@vezham/utils`](./system-utils.md) for shared app-agnostic utilities
  instead of duplicating them in generated apps.
- Keep the reusable application shell in `@vezham/react`, including layouts,
  menus, panels, shell providers, and their state. Each app owns its routes and
  passes its navigation metadata to the shared shell.
- Do not change another `@vx/*` package as part of extracting app-common code
  unless the user explicitly approves that package change.
- Keep demo pages, sample API routes, stories, fixture content, mocks, and E2E
  projects in the playground when they test behavior. Exclude them from CLI
  output unless the user explicitly selects the corresponding feature.
- Pass generated `vxI18n` to the shared Control Center as `context={{ i18n: vxI18n }}`.
  `@vezham/react` owns language option labels and document-language behavior; do not
  copy option mapping or hardcoded language lists into app wrappers.
- Generated files are outputs, not templates to edit by hand. Generate them from
  the app config and source content in the created app.
- No compatibility layer for earlier Vx app templates is required.
- Use `V_APP_ENV` for deployment selection, including `qa` and `preview`,
  without legacy boolean environment flags. Build mode remains independent.
- Require `V_APP_ID`, `V_APP_NAME`, and `V_APP_VER` at runtime.
  Default absent or empty `V_APP_ENV` to `local` independently of build mode.
  Reference app `.env` files omit it; deployments explicitly set and validate
  their target environment. Metadata generation supplies identity
  and version from `vx.app.yaml` and preserves the deployment setting. Do not
  infer deployment from build mode or substitute placeholder identity/version.
- Next app configs import `configEnv` from `@vezham/env/next/config` so Nx can
  inspect configuration before runtime environment validation. Application code
  uses `@vezham/env/next` for validated settings.
- Use `V_RELEASE_CHANNEL` (`canary`, `beta`, or `stable`) as the only release-channel
  input in app templates. It defaults to `stable`; compare the channel directly for conditional behavior.

## Demo and School OS baselines

Both `apps/demo` and `apps/school-os` are CLI app template reference applications.
Demo exercises shared features and testing scenarios; School OS supplies the
product-scale baseline. Use their shared conventions for newly generated apps,
while selecting only the files and features required by the chosen app type.
Treat School OS as a clean starting point, not as an upgrade target for an earlier
implementation.

Apply these rules whenever reviewing, migrating, or optimizing either app:

- Optimize for the current stack and generated output. Do not add aliases,
  shims, deprecated APIs, legacy identifiers, or migration-only branches unless
  a user explicitly requests an upgrade path.
- Use `@vezham/react-v3`, `@vezham/react-pro-v3`, and
  `@vezham/icons-react`. Removed Vezham implementations and the previous
  Iconify, Lucide, Solar, MDI, and Gravity UI dependencies are not compatibility
  requirements.
- Keep HeroUI's root `react-aria` peer pinned to the version bundled by the
  `react-aria-components` catalog version. Custom tooltip triggers require a
  shared focus context; review both versions together when updating dependencies.
- Import fixed icons directly from `@vezham/icons-react`. Use `AppIcon` only
  when an icon is selected from serializable data or runtime configuration.
  Data-driven icon identifiers use semantic `vx:*` names, such as `vx:home`,
  `vx:star-filled`, and `vx:sort-ascending`. The `AppIcon` registry is their
  source of truth; do not accept identifiers named after a removed icon set.
- Use TanStack Router for destinations inside the application, including
  root-relative and same-origin URLs. Open cross-origin URLs as external links.
- Keep same-directory imports relative. Use the aliases declared in
  the app's `tsconfig.app.json` when importing across source directories.
- Compare older applications or archived source only to recover intended
  behavior. Reimplement that behavior with the current baseline instead of
  preserving the old implementation.
- Port tests that protect template behavior, and run validation through the
  corresponding app's Nx targets. A historical test or implementation is not itself a
  compatibility contract.
- Declare dependencies in the app or package that consumes them. When multiple
  workspace packages need the same version, keep that version in the pnpm
  catalog and reference it from each package manifest. Keep CLI-generated mock
  app manifests aligned with their template source rather than cataloging their
  dependencies only in the generated examples.
- Keep workspace audit suppressions scoped to real framework entry points or
  verified false positives. Remove unused app exports rather than copying
  app-specific `ignoreExports` entries into the CLI template.

Keep this section focused on durable template decisions. When a review changes
one of these decisions, update this handbook in the same change. Do not record
temporary debugging state, local paths, command output, or a transcript of the
review.

The current reference apps cover a basic TanStack app
(`apps-internals/playground-app`), a CDN-oriented Vite app
(`apps-internals/playground-cdn`), a docs app
(`apps-internals/playground-docs`), and additional playground, TanStack Start,
and Next.js scenarios. These are examples to evaluate, not a fixed list of
files for the CLI to copy.

## Evaluating another test app

1. State the scenario it tests and which existing reference app is closest.
   Add only the app-specific files needed to exercise that scenario.
2. Check whether any new behavior belongs in the shared package rather than
   the app. Keep framework entry points and config consistent with the existing
   reference apps where their behavior is the same.
3. Identify the minimum files and options a newly created app would need. Mark
   tests, fixtures, and demonstrations as playground-only when defining the CLI
   file selection.
4. Validate the app through its Nx build, typecheck, lint, and relevant tests;
   use E2E coverage when browser or hydration behavior matters. Follow the
   workspace [quality rules](./coding-standards/rules/quality.md) and
   [audit handbook](./audits.md).
5. Review generated metadata, deployment config, and docs/OG outputs where the
   scenario uses them. See [Vx config](./vx-config.md) and
   [deployment](./deploy.md) for their source-of-truth rules.

The shared Vite provider still contains placeholder `preConfig` and `config`
hooks with no active store, worker, or Axios setup. They are not a blocker for
new test apps, but do not expose those placeholder options as supported CLI
features without implementing or removing them.

Control Center configuration uses one optional `label` override for the tile,
detail panel heading, and editor entry. Built-in names are supplied by React;
`title` is not accepted in YAML or configured tile registrations.

Settings route entries use `SettingsRoute` and `validateSearch` from
`@vezham/react/pages/settings`. React owns section validation, query navigation, and
Back to app behavior; applications supply their generated Control Center config.

App root routes use `AppLayout` from `@vezham/react/layouts/app`. It renders explicit
children when supplied, otherwise the router outlet. Optional `settings` enables
Settings navigation and layout switching and requires an app-owned `/settings`
route. Pass generated Control Center configuration as `controlCenter` and language
configuration as `i18n`; `controlCenterSlot` overrides the rendered control.
These features are independent. Shared providers stay mounted across layouts.
Root route metadata and document setup remain in the application.

Apps can set `controlCenter.editControls: true` in `vx.nav.yaml` to show the
Settings link for editing controls. It requires `AppLayout settings` and an
app-owned `/settings` route. Docs omit this option. Control Center has no inline
editor; hiding, reordering, and resetting controls happen in Settings.

`createRouter` from `@vezham/start/router/tanstack` supplies default not-found
boundaries below the root so unknown pages keep the application shell and panels
mounted. App catch-all routes only throw `notFound()`; they do not repeat the
shared `NotFound` component or app identity props. An explicit route
`notFoundComponent` or router `defaultNotFoundComponent` overrides the shared view.

See [App layout](./ui/app-layout.md) for the shared props and app route examples.

Keep the filename `vx.nav.yaml`. Its required top-level `navigation` array
defines visible destinations; `items` is not accepted as a legacy alias. Generated
React exports retain the name `navigationItems`.

## Package library templates

Generated TypeScript and React libraries use the same initial version policy as
apps and mocks: the consumer's matching Git release tag, then the installed CLI
version. Pass the resolved value as `projectVersion` to templates; project
manifests must not hardcode an initial version.

Generated TypeScript and React libraries derive repository metadata from the
consumer workspace's `package.json`, falling back to its Git `origin`. Normalize
HTTP(S) and SSH repository URLs to the npm `git+` form with a `.git` suffix;
for example, `https://github.com/owner/repo` becomes
`git+https://github.com/owner/repo.git`. Keep repository values dynamic and serialize
them with `JSON.stringify` in the package templates.

Package templates use `defineConfig` from `@vezham/config/vite-lib`, or
`@vezham/config/vite-lib/react` for React packages. These presets discover source
entry points from package exports and CLI entries, preserve ES module paths, keep
package dependencies external, copy CSS and HTML assets into `dist`, and disable
minification. They also provide workspace cache defaults and declarations from
`tsconfig.lib.json`. React packages add the React SWC plugin. Packages can override
Vite build options through `defineConfig`; test configs remain separate and use
the shared Vitest preset. Shared library defaults stay internal to the presets.

Declare the `@vezham/config` tooling package in workspace-root
`devDependencies`, rather than in publishable package manifests. Package builds
and tests use the workspace installation. Vite and Vitest templates import its
published subpaths directly. Library TypeScript configs do not reference the
removed `packages/vx/config` project; their initial `references` array is empty.

## Public package migration

Reusable implementations live in `@vezham/utils`, `@vezham/hooks`,
`@vezham/react`, `@vezham/env`, `@vezham/template`, `@vezham/start`,
`@vezham/devtools`, and `@vezham/config`. Preserve existing runtime subpaths
when changing package scope. Template components, pages, and store keep their
subpaths; `@vezham/template/app` is the aggregate app entry.

This repository tests installed npm packages. Keep shared conventions aligned with
`vx-fe-pkgs-timeline`, while implementing public package changes in that repository.
Declare published packages at the workspace root. Consumers import
`@vezham/config` directly from its built npm exports; this repository does not
need the package author's workspace loaders or local public-package builds.
Root `prepare` only runs Husky. Cross-package imports use package paths.

The shared app preset in `@vezham/config` alpha.9 and later owns
`ssr.noExternal` for `@vezham/start` and `@vezham/env`; CDN and docs inherit it.
App configs do not need to repeat those entries. Keep installed runtime packages
in Vitest's `server.deps.inline` list so Vite resolves preserved `import.meta.env`
expressions and applies test mocks instead of executing native Node modules.

Workspace CSS remains under `packages/vx/styles`. Generated apps import this
workspace stylesheet from `src/app/global.css`; documentation apps also import
its `docs` entry. Calculate relative imports from the generated project location
so nested directories resolve the same workspace styles.

Public UI packages expose
`dist/index.css` through their root `style` export and top-level `style` field.
Import the package name from CSS; JavaScript imports retain their runtime exports.
These stylesheets register the packages' compiled JavaScript with Tailwind.
The shared library preset emits component CSS to `dist/index.css` and merges the
authored stylesheet into that file. Preserve the generated scoped selectors and
keyframes; replacing this output with only `@source` directives breaks panel
animations and sizing in consumers of the built package.
The docs runtime uses `@vezham/start/styles/docs` for docs layouts and pages.
Keep source paths inside each package's stylesheet rather than referring to
workspace source directories from shared CSS. CSS exports remain side effects;
JavaScript exports remain eligible for tree shaking.
Apps consume published stylesheets from installed npm packages; they do not
need implicit dependencies on local `devtools`, `react`, or `template` projects.
Keep `packages/vx/styles/**/*` in Nx shared cache inputs and register its CSS
entry points in Fallow. Keep root-only package dependency exceptions in Fallow.

Public library builds preserve ES modules, externalize package dependencies, and
publish declarations for every JavaScript export. Environment adapters defer app
values to the consuming app build. Shared test setup and metadata HTML templates
ship with `@vezham/config`.

Keep component-owned state and hooks with their UI. Extract independent hooks
into `@vezham/hooks` and plain utilities into `@vezham/utils`.

## Shared test types

App test configs extend their existing base plus the root `tsconfig.spec.json`.
The root test config owns Vitest, DOM matcher, and framework asset types. Do not
repeat the `types` array in app test configs: TypeScript replaces inherited arrays.
Keep these declarations out of production configs. The shared `@vezham/config`
Vitest setup registers matchers at runtime, so individual tests do not import
`@testing-library/jest-dom/vitest`. Future CLI templates use the same inheritance.
