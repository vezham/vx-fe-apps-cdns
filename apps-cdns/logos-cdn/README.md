# logos-cdn

- logos-cdn-e2e - E2E using Playwright.

## Asset catalog

`public/catalog.json` and `public/catalog-manifest.json` belong to this app,
alongside the SVG files in `public/assets`. Deploy the catalog and assets
together. The docs app reads this catalog from the CDN.

The build runs `catalog:validate` first. It rejects missing/empty SVG files,
duplicate slugs, incorrect logo URLs, and manifest counts that disagree with
the catalog. Run the check directly with:

```sh
pnpm nx run logos-cdn:catalog:validate
```

To resume downloading missing files from the original collection:

```sh
node vx/tools/cdn/sync-assets.mjs logos
```

Icons continue to use npm/jsDelivr; these projects serve illustrations and logos.
