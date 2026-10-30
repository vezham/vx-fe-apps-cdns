# Code Review

Use the shared ESLint configuration to check automated coding standards:

```bash
# Check a project
pnpm nx run @vezham/template:lint

# Apply supported lint autofixes
pnpm nx run @vezham/template:lint --fix

# Check all projects with a lint target
pnpm nx run-many -t lint

# Run workspace formatting and lint checks
pnpm nx run @vx:@vx-ws/format

# Apply workspace lint and style autofixes
pnpm nx run @vx:@vx-ws/fix
```

`unused-imports/no-unused-imports` reports unused imports and removes them with
`--fix`. `unused-imports/no-unused-vars` reports unused variables separately;
update inline suppressions to use this rule name. Prettier handles import order.

The custom rules in `vx/tools/eslint/` run through the shared `eslint.config.mjs`,
including editor ESLint diagnostics. These rules exclude `.agents/**`; other
applicable lint rules still apply there.

| Rule                            | Checks                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `@vx-lint/button-on-press`      | Explicit `onClick` on imported Vezham UI Button, including import aliases and namespace imports.        |
| `@vx-lint/accessibility-labels` | Accessible names for Vezham UI icon-only Buttons and `Table.Content`.                                   |
| `@vx-lint/comment-style`        | Structured developer comment prefixes and non-empty explanations.                                       |
| `@vx-lint/dot-notation`         | Flat component imports, re-exports, and namespace access when a compound export is available.           |
| `@vx-lint/named-exports`        | Default exports in reusable `src` code, with route, Next.js entry, configuration, and story exceptions. |
| `@vx-lint/wildcard-barrel`      | Selective, unaliased re-exports in internal `index.ts`/`index.js` barrels.                              |
| `@vx-lint/props-name`           | Private `Props` and descriptive exported props names in component files.                                |

`@vx-lint/dot-notation` reads module exports from local source and installed
packages, including the base and Pro component packages. It recognizes explicit compound APIs
created with `Object.assign(Root, { Header })` or an object such as `{ Header }`,
then follows relative imports and named or wildcard re-exports. It reports only
when the imported module exposes both the flat component and a compound member
bound to the same value. No component list or per-component configuration is
needed.

For example, this custom component is detected automatically:

```tsx
const ProfileRoot = () => <section />
export const ProfileHeader = () => <header />
export const Profile = Object.assign(ProfileRoot, { Header: ProfileHeader })
```

Consumers import `Profile` and use `<Profile.Header />`. Importing
`ProfileHeader` from that module reports an error. Import aliases and direct
namespace access are checked too; type-only imports are allowed.

Resolution uses the importing file's nearest `tsconfig.json` and installed
package exports. Source inspection is bounded and does not execute modules.
Unresolved modules, declaration-only packages without adjacent JavaScript,
CommonJS, dynamic factories, property assignments, and ambiguous relationships
are skipped. The rule checks consumers, not declarations inside the component's
own module. It reports without autofixing because changing imports and callers
requires review.

These checks report errors without autofixing: event handlers, exports, type
names, and comment authors require review. Button checks do not trace prop
spreads or wrapper components. Comment checks cannot judge explanation quality
or infer authorship; recognized agent prefixes must use `vx-bot`.
Wildcard checks target barrels below `src/lib` and the `src/components`,
`src/pages`, `src/store`, and `src/hooks` directories. Public `src/index.ts`
entries and intentional aliases remain explicit. The wildcard rule also allows
selective re-exports from package paths and source entry points declared in the
nearest package's `exports`, including conditional and wildcard targets. These
API boundaries do not need rule suppressions; internal relative barrels remain
subject to the check.

The rule autofixes simple top-level private functions used only in direct calls
and named exported hooks such as `usePosts`. Other exports and ambiguous cases
need manual review. Known exceptions such as generators, overloads, dynamic
`this`, and direct use before declaration are retained. Review the resulting diff
and apply repository formatting after lint autofixes.

Typechecks, tests, and handbook rules requiring judgment remain separate from
linting. Run the relevant Nx targets and review behavior when making changes.

See [Code audits](../audits.md) for Fallow and React Doctor checks, score gates,
and guidance on reviewing findings and exceptions.
