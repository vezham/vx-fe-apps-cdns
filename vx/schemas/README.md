# Vx configuration schemas

- `vx.nav.json`: schema for `vx.nav.yaml`, covering ordered menu items and nested navigation.

- `vx.app.json`: schema for `vx.app.yaml`, covering app framework, metadata, branding, i18n, PWA, docs, routes, and OG configuration.
- `vx.deploy.json`: schema for `vx.deploy.yaml`, covering deployment preset and hosting-provider options.

App YAML files reference these JSON schemas through a YAML language server
directive so editor validation works offline:

```yaml
# yaml-language-server: $schema=../../vx/schemas/vx.app.json
```

Use `vx.deploy.json` for deployment files. Adjust the relative path when creating
an app at a different directory depth.

Each schema is self-contained and uses JSON Schema draft-07. Publish the files
unchanged at their `$id` URLs under `https://vezham.com/schemas/` when hosting is
ready. The `$id` identifies the schema; it does not publish it.

Keep the schemas aligned with `@vezham/config` when adding or changing
configuration fields. These schemas provide editor validation; the CLI's
existing runtime validation remains separate.
