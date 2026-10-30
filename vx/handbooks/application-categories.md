# Application Types and Categories

Type selects the application template. Category selects the workspace group,
folder prefix, and Nx category tag. Choose them independently, subject to the
category filters below.

## Generation flow

**Type → filtered category → project name → optional directory → generate**

Select the type through the generator command: `app`, `app-start`, `app-doc`,
`app-cdn`, or `mock`. The selected generator asks for category, name, and an
optional directory group in that order. Supplied options skip their prompts;
non-interactive calls supply options directly.

`app` and `app-start` are alternatives for a main application. Use one type for
each category and project name. Docs and CDN templates can live in their own
group or alongside the main application by selecting its category. Categories
organize projects; they do not automatically create dependencies between them.

## Category order and purpose

Common public categories come first, supporting categories next, then internal
and organization-specific categories:

- **Main applications:** Apps, Showcases, Suites, Platforms.
- **Supporting applications:** Widgets, Docs, Pods, CDNs.
- **Internal and organization-specific applications:** Internal, Vezham Apps.

Keep this order in enums, prompts, and the shared category type. Omit choices
unavailable to the selected type.

| Order | Label       | Value      | Folder            | Purpose                                                                 |
| ----- | ----------- | ---------- | ----------------- | ----------------------------------------------------------------------- |
| 1     | Apps        | `app`      | `apps/`           | Standard product applications.                                          |
| 2     | Showcases   | `showcase` | `apps-showcases/` | Curated demos and examples.                                             |
| 3     | Suites      | `suite`    | `apps-suites/`    | Product suite applications.                                             |
| 4     | Platforms   | `platform` | `apps-platforms/` | CX platform applications.                                               |
| 5     | Widgets     | `widget`   | `apps-widgets/`   | App extensions, integrations, and chat widgets.                         |
| 6     | Docs        | `doc`      | `apps-docs/`      | Handbooks, roadmaps, architecture, and product guides.                  |
| 7     | Pods        | `pod`      | `apps-pods/`      | Shared SaaS infrastructure, such as `accounts`, `myaccount`, and `iam`. |
| 8     | CDNs        | `cdn`      | `apps-cdns/`      | Shared assets and static content delivery.                              |
| 9     | Internal    | `internal` | `apps-internals/` | Internal tools, utilities, and playgrounds.                             |
| 10    | Vezham Apps | `vezham`   | `apps-vezham/`    | Public applications from vezham.com.                                    |

Widgets extend other applications with integrations or chat features. Pods
supply shared SaaS infrastructure such as account management and identity and
access management. Vezham Apps is an organization-specific group even when its
applications are public.

## Category availability

Shared categories are `app`, `showcase`, `suite`, `platform`, `widget`, `pod`,
`internal`, and `vezham`.

| Category               | `app` | `app-start` | `app-doc` | `app-cdn` | `mock` |
| ---------------------- | :---: | :---------: | :-------: | :-------: | :----: |
| Apps — `app`           |  Yes  |     Yes     |    Yes    |    Yes    |  Yes   |
| Showcases — `showcase` |  Yes  |     Yes     |    Yes    |    Yes    |  Yes   |
| Suites — `suite`       |  Yes  |     Yes     |    Yes    |    Yes    |  Yes   |
| Platforms — `platform` |  Yes  |     Yes     |    Yes    |    Yes    |  Yes   |
| Widgets — `widget`     |  Yes  |     Yes     |    Yes    |    Yes    |  Yes   |
| Docs — `doc`           |   —   |      —      |    Yes    |     —     |   —    |
| Pods — `pod`           |  Yes  |     Yes     |    Yes    |    Yes    |  Yes   |
| CDNs — `cdn`           |   —   |      —      |     —     |    Yes    |   —    |
| Internal — `internal`  |  Yes  |     Yes     |    Yes    |    Yes    |  Yes   |
| Vezham Apps — `vezham` |  Yes  |     Yes     |    Yes    |    Yes    |  Yes   |

These restrictions are one-way: `doc` requires `app-doc`, and `cdn` requires
`app-cdn`. Neither template is fixed to its dedicated category. For example,
`app-doc --category=app` and `app-cdn --category=app` are both valid.
Schemas, TypeScript options, and runtime checks enforce the filters before
project files are written.

## Names, folders, and repositories

Use the same final name for the folder basename, Nx project name, and app package
manifest. Names are normalized to file-name form before checking their trailing
role suffix. Template type controls automatic suffixes; category still selects
the parent folder and tag.

| Generator   | Default suffix | Example input → final name     |
| ----------- | -------------- | ------------------------------ |
| `app`       | None           | `school-os` → `school-os`      |
| `app-start` | None           | `school-os` → `school-os`      |
| `app-doc`   | `-docs`        | `school-os` → `school-os-docs` |
| `app-cdn`   | `-cdn`         | `school-os` → `school-os-cdn`  |
| `mock`      | `-mock`        | `school-os` → `school-os-mock` |

Add a missing suffix once. Existing trailing suffixes are preserved, so
`play-mock` stays `play-mock`, `play-cdn` stays `play-cdn`, and `play-docs` stays
`play-docs`. Documentation also accepts the singular `-doc` ending without
adding another suffix. A matching word elsewhere in the name does not count:
`mock-center` becomes `mock-center-mock`. Normalization happens first, so
`Play CDN` becomes `play-cdn` without a second suffix.

All five generators accept `--skipSuffix` (default `false`). It keeps the
normalized supplied name without adding or removing a role suffix. Use it for a
standalone base/main site of any name, including documentation or CDN sites:

```sh
pnpm nx generate @vx-cli/react:app-doc home --category=doc --skipSuffix
pnpm nx generate @vx-cli/react:app-doc knowledge-base --category=doc --skipSuffix
pnpm nx generate @vx-cli/react:app-cdn assets --category=cdn --skipSuffix
```

These create `apps-docs/home`, `apps-docs/knowledge-base`, and `apps-cdns/assets`,
with matching project and package names. Their E2E siblings use `-e2e`, such as
`apps-docs/home-e2e`. The standalone site keeps its chosen template and category;
`home` is only an example, not a reserved name. For ordinary app templates,
enter optional category/role suffixes such as `-widget` yourself.

Category sets the parent folder and `category:<value>` tag. An optional directory
adds grouping folders without changing the project name. For example,
`app-doc school-os-docs --category=app --directory=education` creates
`apps/education/school-os-docs` with the project and package name
`school-os-docs`.

An app's E2E project is generated beside it using `<name>-e2e` for its folder,
Nx project, and package name. The standalone mock generator follows the same
suffix policy above. Its folder, project, and manifest also match. Both `play`
and `play-mock` produce the same mock project `play-mock` and the same default
host `play.mock.vezham.local`; existing project checks prevent creating it twice.

Project names must be unique across the workspace, including E2E and mock names.
The generators check every planned project's name and output path before writing
files. Reusing a name in another category, changing an existing main app from
`app` to `app-start`, or overwriting an existing output path is rejected.

Use the same category, name, and folder convention in dedicated repositories and
combined lab/test repositories. Repository names do not change category routing.

## Combined lab example

```text
app-start → app    → school-os
app-doc   → app    → school-os-docs
app-cdn   → cdn    → school-os-cdn
app       → widget → school-os-widget
```

```text
repo/
├── apps/
│   ├── school-os/
│   ├── school-os-e2e/
│   ├── school-os-docs/
│   └── school-os-docs-e2e/
├── apps-cdns/
│   ├── school-os-cdn/
│   └── school-os-cdn-e2e/
└── apps-widgets/
    ├── school-os-widget/
    └── school-os-widget-e2e/
```

Choosing `app-doc → doc → school-os-docs` places that documentation application
in its own group instead:

```text
apps-docs/
├── school-os-docs/
└── school-os-docs-e2e/
```

Choosing `app-cdn → app → school-os-cdn` similarly places the CDN application and
its E2E sibling under `apps/`. These are alternate placements for each project;
creating both with the same project name in one workspace is rejected.

## Maintaining the convention

Keep category `value` and `label` pairs consistent wherever a category is shared.
Filter unsupported categories from both enum values and prompt choices. Use
lowercase CLI values and readable labels, such as
`Pods - Shared SaaS infrastructure applications`.

Keep the [shared category type and folder mapping](../../packages/cli/react/src/utils/application-category.ts),
all five schemas, their TypeScript options, and runtime checks aligned. See the
[CLI template baseline](./cli-template-baseline.md) for the remaining generation
conventions.
