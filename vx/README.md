# Developer Platform

The `vx` directory contains the shared developer platform used across Vezham
repositories. It provides reusable tooling, workspace automation, shared
configurations, and developer resources.

## Architecture

```text
Repositories
      │
      ▼
   @vx/ws 🏗️
      │
      ▼
   @vx/kit 🧰
```

## @vx/kit 🧰

Reusable developer toolkit providing shared scripts, configurations,
utilities, testing helpers, and other reusable developer resources.

## @vx/ws 🏗️

Workspace automation built on top of **@vx/kit**, providing commands for
formatting, linting, testing, releasing, dependency management, and other
workspace operations.

## Code Review

See [Code Review](./handbooks/coding-standards/review.md) for review and fix commands.

## Handbooks

- [Local Development](./handbooks/local-development.md)
- [Vx Config](./handbooks/vx-config.md)
- [Application Categories](./handbooks/application-categories.md)
- [Deployment](./handbooks/deploy.md)
- [Coding Standards](./handbooks/coding-standards/index.md)
- [Release Versioning](./handbooks/release.md)
