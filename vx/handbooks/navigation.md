# Navigation

Each app using the shared shell owns `vx.nav.yaml` at its root. It defines
ordered menu items and nested sidebar or route-tab destinations. Routes and
React callbacks remain in application code. The required top-level `navigation`
array holds visible destinations; optional `appMenu` and `controlCenter` configure
the other shell controls. The filename remains `vx.nav.yaml`.

See the [YAML handbook](./yaml.md) for syntax, schema comments, anchors, and
aliases, including how they differ from navigation inheritance.

```yaml
# yaml-language-server: $schema=../../vx/schemas/vx.nav.json
navigation:
  - key: home
    title: Home
    href: /
    icon: vx:home
    iconActive: vx:home-filled
```

Items require `key` and `title`. Optional fields are `href`, `icon`,
`iconActive`, and recursive `children`. Keys must be unique among siblings.
Array order determines presentation order. A group may omit `href`.

## Application menu

`appMenu` is a top-level array, separate from `navigation` and toolbar actions.
Each menu has a `key`, `label`, optional `icon`, and `groups` of actions. Each
non-empty group is separated visually. Actions have a globally unique `key`,
`label`, optional `icon`, and optional `shortcut` display string.

```yaml
appMenu:
  - key: file
    label: File
    groups:
      - - key: file.new
          label: New…
          shortcut: Mod N
```

Generation exports `appMenu` alongside `navigationItems`. Pass both to
`AppLayout`. The shared header emits configured action keys with the active
page key and pathname through the same app-scoped dispatcher as toolbars.
Register handlers with `useToolbarAction('file.new', handler, { pageKey })`.
Unhandled actions show a TODO toast. Shortcut strings describe the menu and
are not automatically registered as hotkeys; app code owns keyboard bindings.
Shell controls (Home, Search, Sidebar) remain runtime controls.

## Toolbar configuration

Navigation items may define a serializable `toolbar`. Put shared defaults on
the owning menu and page-specific overrides on its descendants:

```yaml
toolbar:
  search: true
  sync: true
  filter: true
  menuActions:
    - key: print
      label: Print
      icon: vx:printer
  primaryAction:
    key: create
    label: Add Class
    icon: vx:plus
```

Use `getNavigationToolbar(navigationItems, pathname)` from `@vezham/react` to resolve
the deepest matching destination and its ancestors. Toolbar fields inherit
until explicitly overridden. Search objects, primary actions, and menu arrays
are replaced as whole fields. `search: false`, `sync: false`,
`filter: false`, and `primaryAction: false` disable inherited controls; `menuActions: []` clears the
menu. Omitted controls are absent. Menu actions support recursive `children`.
`search: true` uses the default label “Search content” and placeholder “Search”.
Use a search object with `label` and `placeholder` for custom text.
The mobile bottom navigation shows its Search button only when the active
destination's resolved `toolbar.search` is enabled; absent or false hides it.
Its button emits the page-scoped `search` toolbar action. Demo toolbar searches
show a placeholder toast until page search is implemented; global command
search remains a separate application-menu action.
At `lg`, toolbar Search shows an editable input and Enter invokes its action.
Smaller screens use the Search icon. Toolbar Search has no keyboard shortcut;
Mod+K is reserved for global command search.
On mobile, the primary action sits at bottom-right beside the navigation pill;
Search sits above it beside the page tabs. When the primary action is absent or
`false`, Search moves down beside the navigation pill.
YAML anchors can reuse static defaults across sibling menus.
`filter` independently enables the filter menu; `view` contains only grid/list
view actions. Filter visibility does not depend on the configured view modes.
`sort: true` independently enables Sort with Name, Created date, and Updated date
fields and Ascending/Descending direction. It defaults to Name ascending;
`sort: false` disables inherited sorting. `SectionLayout` retains the current
selection and calls `onSortChange` with `{ by, direction }` so applications can
apply it to their data. Sort appears after Filter and before View, including
in the mobile More menu. Below 640 px, More uses the same sheet as the
application menu: Filter, Sort, and nested actions replace the sheet contents
with Back navigation. Selection changes keep the sheet open; invoking an action
closes it. Wider screens retain dropdowns and submenus.

Action `key` values are stable handler IDs. Apps bind them to callbacks and own
state, permissions, API calls, and navigation behavior. Do not put executable
callbacks, React components, or platform-specific implementation in the YAML;
native consumers can interpret the same configuration independently.

## Action dispatch

`AppLayout` provides an app-scoped toolbar dispatcher. Import its hooks from
`@vezham/react/toolbar-actions`. Toolbars emit `{ actionKey, pageKey, pathname }`;
their adapters only prepare rendering and dispatch, without performing actions.
Clicks and shortcuts use the same dispatch path. Search input remains controlled
separately.

Register a page handler where its state lives:

```tsx
const [isDrawerOpen, setIsDrawerOpen] = useState(false)
useToolbarAction('create', () => setIsDrawerOpen(true), {
  pageKey: 'allclasses'
})
```

Subscriptions stay registered across callback changes, while dispatch uses the
latest committed callback. They re-register only when the action key, scope,
or enabled state changes, and clean up on unmount. Dispatch checks only the
handlers registered for that action key. A matching
page or pathname scope takes precedence over an unscoped app default. Only one
handler runs; the latest registration wins at equal specificity. An unhandled
action returns `false` from `emit`. Separate providers isolate app instances.
Layouts register default Sync and Print handlers; pages register Create handlers.
Standalone consumers can mount `ToolbarActionsProvider` without `AppLayout`.

`sync` expresses the intent to synchronize data with the server. Its button and
tooltip say Sync. App handlers currently show “Server sync is not implemented
yet.” without reloading or invalidating the route. Replace the notice with
server synchronization when available. Shared layouts invoke the app's `onSync`
callback; `@vezham/start` mounts the toast provider once in its shared app provider,
including apps that do not use `AppLayout`.

`metadata:generate` writes `src/generated/navigation.ts` when the YAML file
exists. Import `navigationItems` from `@generated/navigation` and pass it to
`AppLayout`; section layouts select the appropriate item's children from the
same tree. `metadata:watch` watches app and navigation YAML changes.

Use `getNavigationChildren('academic')` from `@generated/navigation` to select
a top-level item's children. It returns an empty array for a leaf and throws
an explicit error for an unknown key. Keys are scoped to the top-level items
for this helper, since nested keys may repeat across different sections.

Edit the YAML source instead of generated TypeScript. Action callbacks, dynamic
badges, permission filtering, and stateful tabs belong in handwritten code
that consumes the generated data. This generator targets the web shell;
other repositories may adapt the shared keys and hierarchy for native screens.

Use `SectionLayout` from `@vezham/react/layouts/section` for route sections with
header tabs and an optional sidebar. It uses the shell's shared collapse state,
a 224px desktop sidebar, and a drawer on small screens. Pass section destinations
through `sidebarItems`, the active section's children through `tabs`, and custom
header controls through `toolbar`. Render an `Outlet` as its children so each
app owns the content pages and their toolbars independently of the navigation
layout. Keep the layout on a parent route so child navigation preserves it.

When a section has no tabs, leave the toolbar title area empty. The section
title remains available for accessible tab labels and the mobile sidebar dialog.

Section headers follow the School OS toolbar: sidebar/history controls and tabs
on the left; Search, Sync, More, and the primary action on the right. Pass
controlled `search`, `menuActions` (with optional submenu children), and
`primaryAction` to `SectionLayout`. Labels come from navigation configuration;
apps bind callbacks. Pass `sync` to control Sync and its shortcut.
On small screens, tabs move below the controls, Search opens a popover, and the
primary action keeps its icon while hiding its label. Demo actions use the same
scoped dispatcher; domain content stays in the app's route outlet.

Short mobile tab groups use a centered content-width pill; long groups scroll
within the available width, leaving space for Search when it sits beside the
tabs. Keep row spacing outside the pill. A new tab collection remounts only
the list so its indicator measures the new labels. The Tabs root and section
shell stay mounted across tabbed and standalone pages. Section layout owns
spacing: the Tabs root has no extra gap and panels have no extra margin or
padding, keeping page content aligned when tabs appear or disappear.

Keep navigation-review demos focused on the navigation and toolbar. Their page
outlets display only the current URL; domain page content is added separately.

## Sidebar controls

UI controls and shortcuts use one toggle callback; preserve explicit close
actions for dismissing drawers after navigation. The shared workspace provider
exposes `toggleNavigation`, not separate expand/collapse methods.

Use macOS menu terminology: **Show Sidebar** and **Hide Sidebar**. Sidebar
controls show a shortcut tooltip and use ⌘S. Section toolbars also support ⌘←
for Back, ⌘→ for Forward, and ⌘R for Sync. Register sidebar actions with
`useSidebarShortcut` so the active layout handles the shortcut once, including
the mobile drawer.

For shortcuts that accept either platform modifier, pass `Mod` to `ShortcutKey`
or `ShortcutTooltipLabel` (for example, `Mod K`). It displays ⌘ on macOS and
Ctrl on Windows/Linux. Keep explicit modifiers for bindings that require them.

## Dock controls

The application menu/taskbar is the **Dock**, distinct from a section sidebar.
Its header uses **Show Dock** / **Hide Dock**, with a single `onToggleDock`
callback and `isDockHidden` state. Hide Dock is available on every desktop
destination. The Home dock has independent collapse state. Existing workspace
collapse state still controls the dock alongside section navigation outside
Home. Keep section sidebar controls labeled **Show Sidebar** / **Hide Sidebar**.

For root shell composition, optional Settings routing, and Control Center props,
see [App layout](./ui/app-layout.md).

Section navigation items can set `childrenDisplay: sidebar` to show child pages
in an expandable, indented sidebar group instead of page tabs. The default is
`tabs`; there is no automatic item-count threshold. The active sidebar group
opens on navigation and highlights its child page. Clicking the parent row
toggles expansion without navigating; child rows navigate. Expansion state lives
in the section layout so switching tab collections or standalone pages does not
collapse open groups. Hover highlights the whole row. Sidebar typography, spacing, icons,
and the trailing disclosure arrow retain the section navigation styling.
The mobile section drawer
uses the same nested list. Demo Examinations exercises the sidebar mode.

Filter and sort selections reset when navigating to a different section. Tabs
within the same section retain them. Sort resets to Name ascending and notifies
`onSortChange`. Pass a stable `sectionKey` to identify the scope explicitly;
otherwise the selected sidebar item, tab collection, or standalone title defines
it. Demo passes the section key from generated navigation.
