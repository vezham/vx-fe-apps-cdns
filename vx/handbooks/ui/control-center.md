# Control Center

A Control Center is a compact overlay for frequent preferences. It uses an
ordered tile registry and a local panel outlet for detail screens. Opening a
detail screen does not add a browser-history entry; Back returns to home.

The shared implementation is `ControlCenter`, exported from
`@vezham/react/control-center`. The package root also exports the main
`ControlCenter` and `ControlCenterProps`; tile helpers and their types live under
the dedicated path. It accepts a typed `tiles` registry and current `context`;
the React package owns the tile UI, options lists, appearance behavior, and
common detail panels. Apps keep their ordered YAML config and supply app-specific
actions. The notebook adapter connects shared appearance tiles to its theme
provider and shared language tiles to its locale routes.

Use `AppearanceToggle` for a compact, icon-only light/dark toggle, or
`AppearanceTile` with `AppearanceSettings` for a detail
panel. Without an `appearance` adapter, `ControlCenter` tracks and changes the
document root's `dark` class. Apps with a theme provider supply
`appearance={{ isDark, setDark }}` to keep that provider authoritative.

`AppearanceSettings` adds Light, Dark, and Auto. Auto follows
`prefers-color-scheme` while the control center is mounted,
including when its overlay is closed. Manual appearance toggles leave Auto.
The default implementation records the mode in `html[data-theme-mode]` for the
current document. A theme provider can additionally supply `themeMode` and
`setThemeMode`; Auto is available only when its adapter supports it.

`ThemeTile` and `ThemeSettings` select an accent color:
Blue, Purple, Pink, Red, Orange, Yellow, Green, or Graphite. The shared swatch
picker updates the root's accent tokens and existing primary HSL tokens without
changing appearance. The Default action restores the original inline token
values and priorities, allowing stylesheet themes to take over again. Selection
is stored in `html[data-vx-theme-color]` for the current document; the tile shows
the selected name and color. Apps only register the shared tile and panel.

`DirectionTile` and `DirectionSettings` select LTR or
RTL and update `html[dir]`. `DocumentLanguageTile` and
`DocumentLanguageSettings` accept generated `i18n` configuration and
update `html[lang]`. This document language control does not translate app copy
or navigate locale routes; use the app language adapter below for those actions.

`LanguageTile` and `LanguageSettings` receive
`context.language` with `value`, `options`, and `onChange`. Options include a
`value`, `label`, and optional `href`; links preserve modified clicks while
normal selection calls the app's navigation action. The React package does not
import app-specific providers, generated locales, or route definitions.

The footer accepts a `controlCenter` element alongside `showControlCenter`.
When enabled without app registration, it opens the shared Control Center with
Appearance, Theme color, and Direction. When application Settings navigation
is available, the default also offers an Edit Controls link to Settings. The old drawer and
`onControlCenterClick` callback have been removed. On small screens (below 768px), Control Center opens from the footer More
menu. On larger screens, its trigger renders directly in the footer. Both paths
use the same instance and settings state.

Supply `<ControlCenter context={context} tiles={tiles} placement="right bottom" />`
to replace that default with an app-specific registry and adapters. The current
implementation and its props use the canonical `ControlCenter` and
`ControlCenterProps` names; the temporary `ControlCenter2` names are removed.

`AppLayout` accepts generated configuration as `controlCenter={controlCenter}`
and language configuration as `i18n={vxI18n}`. It creates the shared
`ConfiguredControlCenter` and forwards it through desktop and mobile navigation.
Use `controlCenterSlot` when supplying a custom React element. The shared package
creates language labels and uses the configured default language; no app wrapper
or hardcoded language options are needed. See [App layout](./app-layout.md) for
props, Settings routing, and complete app examples.

## UI review controls

The demo passes `preview` to `ControlCenter` and registers shared
`Preview*` tiles for Wi-Fi, Bluetooth, AirDrop, Do Not Disturb,
Stage Manager, Screen Mirroring, Media, Display, and Sound. They use fixtures
and local state, shown with a simulation notice. They do not control hardware,
system brightness or audio, system notification settings, or play actual media.
The preview provider owns state across detail screens, overlay closing, and
responsive presentation changes; apps keep only tile registration.

Editing controls happens in the application Settings gallery. There is no inline
editor in Control Center. Detail screens still use the local panel outlet and
reset scroll position when changing panels.

## YAML configuration

Configure the app layout under `controlCenter.tiles` in `vx.nav.yaml`. Array
order determines the initial visual and keyboard order. Each entry has a unique
`id`, a built-in `type` or `custom`, and a `span`. Optional `label` overrides the tile name, detail panel heading, and Edit Controls row. Built-in names are used when omitted.
Set `editable: false` to prevent hiding or moving a tile. Reset Controls in Settings restores the YAML order.

```yaml
controlCenter:
  editControls: true
  tiles:
    - id: appearance
      type: appearance
      span: wide
    - id: language
      type: language
      span: standard
    - id: workspace
      type: custom
      action: workspace.open
      label: Open workspace
      span: full
```

Metadata generation exports `controlCenter` from `src/generated/navigation.ts`.
Pass it to `AppLayout` as `controlCenter`, or to `ConfiguredControlCenter` as `config`. Built-in tiles and their panels are resolved
inside React; the app supplies adapters only when needed. The `language` type
uses `context.language` for routed languages, or `context.i18n` to
update the HTML language attribute (English by default).

```tsx
import { ConfiguredControlCenter } from '@vezham/react/control-center'
import { useToolbarAction } from '@vezham/react/toolbar-actions'

import { controlCenter } from '@generated/navigation'

export const AppControlCenter = () => {
  useToolbarAction('workspace.open', () => openWorkspace(), {
    pageKey: 'control-center'
  })
  return <ConfiguredControlCenter config={controlCenter} context={{}} />
}
```

Custom clicks use the existing toolbar dispatcher provided by `AppLayout`.
Events include `actionKey`, `tileId`, `pageKey: 'control-center'`, and the current
browser `pathname`. Outside `AppLayout`, wrap the app in `ToolbarActionsProvider`
or pass `onAction` directly to `ConfiguredControlCenter`. A missing custom action
handler throws an error rather than silently ignoring a click.

For custom visuals, pass `registrations={{ workspace: { Tile: WorkspaceTile } }}`.
Registrations are keyed by the YAML tile ID. React supplies the app context,
`onAction` to emit the YAML action, and `onOpen` to open the registered `Panel`
(or emit the action when no panel exists). A registration may include `Panel`
and `label`; the app retains these component references in TypeScript.

Supported built-in types: `appearance-toggle`, `appearance`,
`theme`, `direction`, `direction-toggle`, `language`, `preview-wifi`,
`preview-bluetooth`, `preview-airdrop`, `preview-focus`, `preview-stage-manager`,
`preview-mirroring`, `preview-media`, `preview-display`, and `preview-sound`.
`direction-toggle` switches LTR/RTL directly without opening a panel, like the compact `appearance-toggle`.
Keep `preview` enabled for simulated device controls. Shared behavior stays in
React; only app-specific handlers, custom components, and adapters stay in apps.

## Tile registry

Keep every home tile in one ordered registry. Its order is both visual and
keyboard order. A tile either performs its action directly or opens a detail
panel. Model those as separate type branches rather than branching on IDs
elsewhere.

Type the registry as `readonly TileDefinition<Context>[]` so its app context
stays separate from the internal `onOpen` callback injected into detail tiles.
Give every entry a unique `id`; it identifies both the React tile and its detail
panel. Use `AppearanceToggle` for compact icon tiles and `AppearanceTile` for a wide tile
that opens light, dark, and system options.

```tsx
import {
  AppearanceToggle,
  ControlCenter,
  type LanguageAdapter,
  LanguageSettings,
  LanguageTile,
  type TileDefinition
} from '@vezham/react/control-center'

type Context = {
  language: LanguageAdapter
  openWorkspace: () => void
}

const tiles: readonly TileDefinition<Context>[] = [
  { id: 'theme', span: 'compact', Tile: AppearanceToggle },
  {
    id: 'language',
    span: 'standard',
    Tile: LanguageTile,
    title: 'Language',
    Panel: LanguageSettings
  },
  {
    id: 'custom-action',
    span: 'full',
    label: 'Open workspace',
    onAction: context => context.openWorkspace()
  }
]

const AppControlCenter = ({ context }: { context: Context }) => (
  <ControlCenter context={context} tiles={tiles} />
)
```

For custom actions, register `label`, optional `icon` and `description`, and
`onAction(context)`. The shared component renders the tile and invokes the
callback with current context; an app does not need to create button markup.
Custom detail panels can still use `Tile` and `Panel` component references.

Detail tiles receive an `onOpen` callback from the home. The detail panel mounts
only after that callback runs, so it cannot open itself. Derive the active panel
ID from entries that include `Panel`. Store component references, not JSX or
captured route values; pass current context at render time.

## Layout

Use an authored four-unit grid. A registry entry declares its span, and the grid
preserves registry order. Do not use dense packing: it may move later compact
controls into earlier empty cells.

| Span       | Grid units | Use for                                |
| ---------- | ---------- | -------------------------------------- |
| `compact`  | 1          | Icon-only toggle                       |
| `standard` | 2          | Icon, short label, and optional status |
| `wide`     | 3          | Longer labels or grouped controls      |
| `full`     | 4          | Sliders and full-row settings          |

The lg popover is the width reference: both popovers and bottom sheets are capped
at 18rem, with the same 1.5rem inner horizontal inset. Their four-column grids
retain 0.5rem horizontal and 0.75rem vertical gaps at lg, md, and sm. Compact
tiles fill a square cell within that bounded grid. Set a panel width that keeps a standard tile's
icon, padding, label, and status readable. Use separate horizontal and vertical
gutters when rows need more breathing room.

The grid governs placement. A tile component governs its content, including
truncation, icon size, and direct action.

The Settings gallery reuses this grid and its span variants for both suggested
controls and the live preview. A control selected at any span must retain that
same footprint after it is added to Control Center.

## Panel outlet

The overlay owner keeps `isOpen` and `activePanel` state. Render home when
`activePanel` is `null`; otherwise the outlet resolves the matching entry and
renders a shared Back header plus that entry's `Panel`.

Use a Pro bottom Sheet below 768px and an anchored popover at larger widths. Close
the overlay and reset `activePanel` together so reopening starts at home.

## Styling

Use a shared variant definition for the surface, tile spans, tile content, and
selectable option rows. Keep styling decisions in those slots and pass semantic
variants such as `span` or `selected`; avoid component-specific layout logic in
the home renderer.

For a liquid-glass surface, use a translucent background, border, subtle edge
highlight, and backdrop blur. Keep contrast sufficient for labels and focus
indicators in both themes. Icons should use an explicit `size`; classes should
only provide color, spacing, and state styling.

## Verification

Check the following after changing the registry or layout:

- Visual order matches registry order.
- Compact controls fill one square cell; standard, wide, and full controls span
  the correct number of units.
- A direct-action tile works without opening a detail panel.
- A detail tile opens its panel, Back returns home, and closing then reopening
  starts at home.
- The popover is anchored to its trigger on larger screens; the bottom sheet is usable
  on small screens.
- Keyboard focus and accessible names work for every control.

The small-screen sheet has a visible drag handle, a close button, and a bounded
scrolling viewport with safe-area padding. Dragging is restricted to the handle
so tile sliders and settings remain usable. Tile detail screens and Back stay
inside the same sheet. Escape, outside press, close, and handle dismissal use the
same open-state callback and return focus to the trigger or footer More entry.

`controlCenter.editControls` is an optional boolean, defaulting to `false`. Enable
it for apps that use `AppLayout settings` and provide a `/settings` route. It shows
an Edit Controls link in a fixed footer outside the scrolling tiles. The link
hides while a detail panel is open, closes Control Center, and opens Settings. It is not a
tile and does not participate in hiding or reordering. Docs omit the option and
have no editor or Settings link. Raw `ControlCenter` accepts the same optional
`editControls` prop and requires application Settings navigation to show the link.
