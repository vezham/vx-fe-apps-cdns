# System Utilities

`@vezham/utils` contains small, app-agnostic utilities shared by Vx apps and
packages. Keep each public utility in a focused package subpath rather than
adding exports to the package root. Add a new subpath to the package's `exports`
map when a new utility group is introduced.
Match each subpath with a folder under `src/lib`, using its `index.ts` as the
package export entry point.

## Name utilities

Import name helpers from `@vezham/utils/name`:

```ts
import { getInitials } from '@vezham/utils/name'
```

`getInitials` returns the uppercase first letters of the first two non-empty
name parts. For example, `John Doe` becomes `JD`, `Bob` becomes `B`, and a
blank name becomes an empty string. Use it to supply text to avatar fallbacks;
the utility itself has no React or avatar dependency.

Keep these helpers in the shared package when multiple apps or features use
them. Keep app-specific formatting rules in the app that owns them.
