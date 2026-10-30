# Local Development

Development servers consume the local packages' compiled exports. Before the
first `serve` or `dev` run, build the app's package dependencies from the workspace
root:

```sh
pnpm nx run <project-name>:build-deps
pnpm nx run <project-name>:serve
```

Replace `<project-name>` with your app's Nx project name. Use the app's `dev` target instead
of `serve` when its development workflow needs it.

Repeat `build-deps` after cleaning package outputs or editing shared package
source. App source edits use the dev server's normal hot reload.

Dependency builds stay manual for `serve`, `dev`, and `metadata:watch`.
Production builds retain their dependency build ordering.
