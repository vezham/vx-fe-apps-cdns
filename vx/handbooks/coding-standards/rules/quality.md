# Quality Rules

## Formatting

Formatting is enforced automatically.

Do not manually format, align, or wrap code to override workspace tooling.

Workspace standards include:

- EditorConfig
- Prettier
- ESLint
- Stylelint

Use BEM for authored CSS classes: `block`, `block__element`,
`block--modifier`, or `block__element--modifier`, with kebab-case words.
This is the default for both new and existing authored classes across apps and
packages. When migrating a class, update its CSS, markup, selectors, and tests
together. Preserve third-party classes, theme hooks, and Tailwind utilities.
Stylelint's `selector-class-pattern` checks class selector names. Write full BEM
class names; native CSS nesting does not support Sass-style `&__element` suffixes.
This rule does not check class strings in JSX or Tailwind utilities.

## TypeScript

- Prefer strict typing.
- Prefer `unknown` over `any` where appropriate.
- Avoid `any` unless absolutely necessary.
- Prefer type inference where it improves readability.
- Prefer `readonly` where appropriate.
- Keep types close to where they are used.

## Testing

- Write deterministic tests.
- Keep tests independent.
- Prefer readable test names.
- Reuse shared testing utilities where possible.

The root Vitest config supplies common defaults with a Node environment.
App test presets are selected from the required `framework` in `vx.app.yaml`.
Use an app-local `vitest.config.ts` only for additional overrides. Packages
without app metadata can select `@vezham/config/vitest/react`, `/next`, or `/docs`
explicitly; otherwise tests use the Node environment.

Shared jsdom presets run test files sequentially within each project. Nx owns
parallelism across projects, avoiding a separate worker pool per test file
while multiple applications load their route trees.

Router-based app tests use an async `renderApp(path = '/')` helper. Create a
memory-history router, await `router.load()`, then render `RouterProvider`.
Await `renderApp()` in each test so initial route loading finishes before
assertions. Component tests stay synchronous unless they await async behavior.

App E2E suites import `test` and `expect` from `@vezham/config/playwright/test`.
Its automatic fixture checks console and runtime errors after each scenario,
allowing only the resource error associated with an actual main-document 404.

## Dependencies

- Prefer existing workspace utilities before adding dependencies.
- Prefer platform utilities before introducing third-party packages.
- Remove unused dependencies.
- Keep dependencies up to date.
- Minimise transitive dependencies where practical.

## Configuration

- Keep configuration files minimal.
- Prefer explicit configuration over implicit behaviour.
- Use consistent naming across repositories.
- Use `import.meta.dirname` for directory paths in ESM Vite and Vitest configs
  on the Node 24 baseline. Reserve `__dirname` for CommonJS files.
- Document non-obvious configuration with `NOTE` comments.

## Pull Requests

Before submitting code:

- The project builds successfully.
- Type checking passes.
- Linting passes.
- Tests pass.
- Formatting has been applied.
- Dead code has been removed.
- Comments remain accurate.
- Documentation is updated where necessary.
