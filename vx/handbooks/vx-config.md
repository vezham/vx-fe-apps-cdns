# Vx Config

`vx.app.yaml` is the app-level source of truth for Vx metadata, PWA assets,
route rules, docs generation, prerender paths, and social metadata.

`vx.deploy.yaml` is the app-level source of truth for generated hosting and
deployment provider config, such as Firebase Hosting redirects, headers, and
rewrites.

See the [YAML handbook](./yaml.md) for configuration syntax and reusable anchors.

See the [Deployment handbook](./deploy.md) for provider setup and deployment
preset selection.

Keep the app's Vite config thin. App-specific route intent should live in
`vx.app.yaml`; shared behavior should live in `@vezham/config` or `@vezham/start`.

> **AI Instructions**
>
> When changing docs apps, preserve Firebase static-hosting compatibility,
> i18n routes, OpenAPI generation, OG images, and LLMS routes unless explicitly
> instructed otherwise.

---

## Location

Each app owns its config at the project root:

```text
apps-internals/playground-docs/vx.app.yaml
```

The playground docs Vite config should use the shared docs helper:

```ts
import { getPrerenderPages } from '@vezham/config/presets/docs'

tanstackStart({
  spa: {
    enabled: true,
    prerender: {
      enabled: true,
      crawlLinks: true
    }
  },
  pages: getPrerenderPages(import.meta.dirname)
})
```

Do not duplicate docs/i18n/static-path discovery in app-local Vite config.

---

## Core

`core` describes the app identity and canonical URL.

```yaml
core:
  id: vezham-playground-docs
  name: Vezham Playground Docs
  shortName: Playground Docs
  version: 26.0.0-alpha.1
  description: Single app to manage your Vezham Playground Docs
  publisher:
    name: Vezham Technologies Private Limited
    url: https://vezham.com
  url: https://playground-docs.vezham.app
```

Use `core.url` for absolute social URLs and canonical metadata.

---

## I18n

`i18n` controls generated localized docs paths and the app document language.
Generated `vxI18n` and `vxMetadata` include `defaultLanguage` and `languages`,
with `en` and `["en"]` as defaults when i18n is omitted. Pass
`vxI18n.defaultLanguage` to the app provider’s `lang` option. Docs apps use
the active route locale, falling back to this default. The generator appends a
configured `defaultLanguage` to `languages` when it is missing.

```yaml
i18n:
  defaultLanguage: en
  languages:
    - en
    - cn
```

Use `vx.deploy.yaml` to emit optional provider-level redirects for
default-language-prefixed URLs.

```yaml
providers:
  - firebase
redirectDefaultLanguage: true
firebase:
  headers:
    docs: true
```

This is only a provider-level optimization. Runtime canonical behavior should
still live in the shared router/start layer.

Firebase config is generated under `vx/deploy/firebase/<project-root>.json`.
Default static headers, SPA rewrites, and route-derived API headers are emitted
automatically. Docs cache headers are opt-in with `firebase.headers.docs`.

Vercel config is generated under `vx/deploy/vercel/<project-root>.json`. Use
the `next` preset with the `vercel` provider for Next.js applications, then
configure the Vercel project to use its application directory as the root
directory. Use `tanstack-start` with `vercel` for TanStack Start applications;
it emits Vercel's Nitro-backed TanStack Start framework configuration for SSR
and server routes.

Generated docs prerender paths include:

- `/docs`
- default-language docs paths such as `/docs/overview`
- non-default localized roots such as `/cn`
- non-default localized docs paths such as `/cn/docs/overview`

OpenAPI-generated docs pages are included for each locale.

---

## Docs

`docs` controls the public docs route and its matching generated OG route.

Docs content and OpenAPI inputs use the fixed conventions `content/docs` and
`openapi`, respectively. Vezham Docs and Vite need those source paths to be
literal at compile time.

Defaults:

```yaml
docs:
  docsRoute: /docs
```

The field is optional. When `docsRoute` is `/guides`, generated docs OG images
are written under `public/og/guides` and the runtime uses `/og/guides`.

Use top-level `og` to customise generated social images without coupling
application branding to the Vite configuration. The default is a light Vezham
layout with the Vezham logo and Jura footer text. `docs.og` may override these
values when documentation needs a distinct treatment.

```yaml
og:
  theme: dark
  site: Acme Docs
  logo: /icons/logo.svg
```

`logo` accepts a public asset path, an HTTPS URL, or a data URI. Public asset
paths are embedded during generation so static output has no external logo
dependency. `theme` selects the built-in light or dark palette. For custom
layouts, pass a `renderImage` callback to `generateDocsOgImages`.

---

## Routes

Use top-level `routes` as the single source for route rules and config.

Routes are metadata about URL behavior. They are not the app router itself.

```yaml
routes:
  - path: /ui-docs/**
    source: docs
  - path: /ui-notebook/**
    source: docs
  - path: /api/search
  - path: /llms-full.txt
  - path: /llms.txt
```

Route path rules:

- `"/ui-docs/**"` with `"source": "docs"` mirrors docs under `/ui-docs`.
- `"/ui-notebook/**"` with `"source": "docs"` mirrors docs under
  `/ui-notebook`.
- Exact paths such as `"/api/search"` are prerendered as-is.
- Text/file paths such as `"/llms.txt"` are prerendered without an `index.html`
  output override.
- Extensionless non-API paths are emitted as `path/index.html` for static
  hosting.

This keeps Firebase/static-hosting compatible URLs for app pages while still
allowing file routes like `/llms.txt`.

### Source

`source` tells Vx where a route rule should get its expanded route list from.

```yaml
path: /ui-docs/**
source: docs
```

This mirrors the docs source under `/ui-docs`.

For example, docs pages at:

```text
/docs
/docs/overview
/docs/openapi/vezham-demo
```

become:

```text
/ui-docs
/ui-docs/overview
/ui-docs/openapi/vezham-demo
```

Exact routes usually do not need `source`:

```yaml
path: /llms.txt
```

Supported sources:

| Source | Behavior                                         |
| ------ | ------------------------------------------------ |
| `docs` | Expands a `/**` route from generated docs pages. |

Future sources can be added for other route collections, such as blog,
platforms, changelog, or OpenAPI-only pages.

### Prerender

`prerender` is enabled by default for route entries.

```yaml
path: /platforms
prerender: true
```

Disable prerender for a route:

```yaml
path: /internal-preview
prerender: false
```

Override the emitted HTML path:

```yaml
path: /platforms
prerender:
  outputPath: /platforms/index.html
```

Prefer the default output rules unless the route needs special static-hosting
behavior.

### OG

Docs-sourced mirror globs generate mirrored OG images by default.

```yaml
path: /ui-docs/**
source: docs
```

For `/ui-docs/overview`, this generates:

```text
public/og/ui-docs/overview/image.png
```

Use `og: false` to skip OG generation for a route.

```yaml
path: /ui-docs/**
source: docs
og: false
```

Use `og: true` to force OG generation where the route supports generated docs
OG output.

```yaml
path: /ui-docs/**
source: docs
og: true
```

Use `og.image` when the route owns a custom image URL and should not receive a
generated mirrored image.

```yaml
path: /platforms
og:
  image: /og/platforms/image.png
```

Use `og.image` instead of `og_url` or `og_image`. The nested object leaves room
for future Open Graph fields without flattening every social property into the
route shape.

---

## OpenAPI

OpenAPI specifications live inside the configured `openapiDir`.

Default:

```text
openapi/
```

The root OpenAPI document should be:

```text
openapi/index.yaml
```

Additional documents can be nested:

```text
openapi/vezham-demo.json
openapi/platform/admin.yaml
```

Document IDs are derived from the relative path without the extension:

| File                         | Document ID      |
| ---------------------------- | ---------------- |
| `openapi/index.yaml`         | `openapi`        |
| `openapi/vezham-demo.json`   | `vezham-demo`    |
| `openapi/platform/admin.yml` | `platform/admin` |

Generated MDX output is written under the docs content directory in
`openapi/**/(generated)`.

Do not keep a root-level `openapi.yaml`. Use the `openapi/` folder so future
apps can add multiple specs without changing the discovery model.

---

## Metadata

`metadata` generates index metadata, platform tags, and social defaults.

```yaml
metadata:
  title: Home | Vezham Playground Docs
  keywords:
    - Vezham Playground Docs
  social:
    openGraph:
      type: website
      image: /og/image.png
    twitter:
      creator: '@vezham'
      site: '@vezham'
      card: summary_large_image
      image: /og/image.png
```

If no social image is provided, Vx falls back to `/og/image.png`.

For docs pages that use the default social image, `@vezham/start` maps the page to
the page-specific generated docs OG image.

Examples:

| Route                   | OG image                             |
| ----------------------- | ------------------------------------ |
| `/docs/overview`        | `/og/docs/overview/image.png`        |
| `/ui-docs/overview`     | `/og/ui-docs/overview/image.png`     |
| `/ui-notebook/overview` | `/og/ui-notebook/overview/image.png` |

Use a custom `metadata.social.openGraph.image` only when the app should not use
generated docs page images as the default.

---

## PWA And Branding

`branding` controls browser theme colors.

```yaml
branding:
  themeColor: '#000000'
  backgroundColor: '#ffffff'
```

`pwa` controls generated manifest fields, icons, screenshots, shortcuts, and
install behavior.

Icon sets can use a path template:

```yaml
icons:
  path: icons/icon-{size}x{size}.png
  sizes:
    - 48
    - 72
    - 96
    - 128
    - 192
    - 384
    - 512
    - 1024
  type: image/png
```

Paths are relative to the app's public assets unless they start with `/` or an
absolute URL.

---

## Shared Vite Defaults

Use `defineConfig` from `@vezham/config/presets/app` for apps.

```ts
import { defineConfig } from '@vezham/config/presets/app'

export default defineConfig({
  root: import.meta.dirname
})
```

`defineConfig` owns:

- app root and Vite cache directory
- `V_` env prefix
- dev server host/port
- preview host/port using `PRE_PORT`, then `PORT`
- prerender preview override when `TSS_PRERENDERING=true`
- TypeScript path aliases from `tsconfig.app.json`
- React dedupe
- React JSX dev runtime build alias
- app build defaults

App-local Vite configs should only keep app-specific plugins and dedupe entries.

---

## Commands

`metadata:generate` is a single uncached target that writes generated metadata
and updates metadata-managed sections of app-owned `.env` and `index.html`
files while preserving their other content. Caching is disabled so those
app-owned files cannot be overwritten by cached copies. Apps only need to
declare `"metadata:generate": {}` in their Nx targets.

Docs and metadata generation use the same language defaults: omitted i18n becomes
`en` with `languages: ["en"]`, and a configured default is added to `languages`
when absent. OG cache inputs include public source assets, excluding `public/og`.

OG generation records owned images in `public/og/.vx-generated.json`. After a
successful run, it removes previously recorded images that are no longer needed,
including root and mirror images. Keep this manifest with cached OG outputs.
Unrecorded images are preserved; the first run starts tracking current outputs
without removing older, untracked files.

Run docs generation through Nx targets for apps:

```bash
pnpm nx run playground-docs:openapi:generate
pnpm nx run playground-docs:og:generate
pnpm nx run playground-docs:metadata:generate
pnpm nx run playground-docs:deploy:generate
pnpm nx run playground-docs:build
```

The app build targets depend on metadata and deployment config generation. The
docs build also depends on OG generation, so it regenerates required images.

---

## Checklist

When adding a future docs app:

- Add `vx.app.yaml` at the app root.
- Add `vx.deploy.yaml` at the app root when provider config should be generated.
- Keep docs content in `content/docs`.
- Keep OpenAPI specs in `openapi/`.
- Use `openapi/index.yaml` for the default OpenAPI document.
- Add extra prerender paths to top-level `routes`.
- Use docs mirror globs with `source: "docs"` for alternate docs shells.
- Keep LLMS routes in top-level `routes` when the app exposes them.
- Use `getVxDocsPrerenderPages(import.meta.dirname)` in TanStack Start config.
- Use `defineAppConfig` in Vite config.
- Keep app-local Vite config focused on app-only plugins and dedupe.
- Verify typecheck, lint, and build through Nx.

## Framework

`vx.app.yaml` requires `framework`: `vite`, `tanstack`, `tanstack-docs`, or `next`.
Shared metadata and i18n are generated for every app. Only Next apps generate
`nextMetadata` and `nextViewport`; TanStack apps generate `tanstackHead`.
`vxDocs` is generated only for `tanstack-docs`.
The global Vitest config reads this field to select browser setup and framework
plugins. App-local Vitest files are only needed for additional overrides.

## Control Center

`vx.nav.yaml` owns the ordered `controlCenter.tiles` layout. Metadata generation
validates IDs, built-in types, spans, and custom action keys, then exports the
serializable config from `src/generated/navigation.ts`. React resolves built-in
tile components; custom components and emitted action handlers remain in the app.
See [Control Center](./ui/control-center.md#yaml-configuration) for configuration
and dispatch examples.
