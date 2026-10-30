# App layout

`AppLayout` from `@vezham/react/layouts/app` is the shared application shell for
TanStack Router apps. It owns navigation, app menus, user state, toolbar actions,
commands, info panels, and workspace navigation state. Apps own root route
metadata, document setup, generated configuration, and route declarations.

## Basic application

When `children` is omitted, the layout renders the router's `<Outlet />`.
Explicit children replace the outlet; `null` renders no content.

```tsx
import { AppLayout } from '@vezham/react/layouts/app'

import { appMenu, navigationItems } from '@generated/navigation'

const Layout = () => (
  <AppLayout navigationItems={navigationItems} appMenu={appMenu} />
)
```

School OS uses this setup. Components that need explicit content can use
`<AppLayout navigationItems={navigationItems}>…</AppLayout>`.

## Optional features

| Prop                            | Behavior                                                                            |
| ------------------------------- | ----------------------------------------------------------------------------------- |
| `navigationItems`               | Required generated navigation items.                                                |
| `appMenu`                       | App menu configuration; defaults to an empty list.                                  |
| `children`                      | Explicit content; omitted means the router outlet.                                  |
| `user`                          | Initial user state; `null` starts signed out. Omitted uses the shared default user. |
| `settings`                      | Enables Settings navigation and the dedicated Settings layout; defaults to `false`. |
| `controlCenter`                 | Generated Control Center configuration, independent of `settings`.                  |
| `controlCenterSlot`             | A custom React element that takes precedence over `controlCenter`.                  |
| `i18n`                          | Generated language configuration for the configured Control Center.                 |
| `className`, `contentClassName` | Frame and content styling for the standard app layout.                              |

The layout must be rendered inside TanStack Router. The old `routing` prop and
`AppRootLayout` component are removed; all apps use the same `AppLayout` API.

## Settings and configured Control Center

The demo enables Settings and passes generated Control Center and language
configuration:

```tsx
import { AppLayout } from '@vezham/react/layouts/app'

import { appMenu, controlCenter, navigationItems } from '@generated/navigation'
import { vxI18n } from '@generated/vx'

const Layout = () => (
  <AppLayout
    settings
    navigationItems={navigationItems}
    appMenu={appMenu}
    controlCenter={controlCenter}
    i18n={vxI18n}
  />
)
```

`settings` does not create a route. The app must declare `/settings`:

```tsx
import { createFileRoute } from '@tanstack/react-router'

import { SettingsRoute, validateSearch } from '@vezham/react/pages/settings'

import { controlCenter } from '@generated/navigation'

export const Route = createFileRoute('/settings')({
  validateSearch,
  component: () => <SettingsRoute controlCenter={controlCenter} />
})
```

The shared Settings route handles section validation, query updates, and Back
to app (`/`). Pass the same Control Center config so Edit Controls uses the same
registry. When `/settings` matches, `AppLayout` renders the dedicated Settings
frame. Shared providers stay mounted across layout switches, preserving user
and shell state. The Settings navigation context connects Edit Widgets and Edit
Controls actions to their Settings sections.

Without `settings`, the standard app frame remains active on every route.
Without a Control Center config or custom slot, the footer uses its default
Control Center. `i18n` is forwarded to the configured Control Center; custom slots
receive their own context explicitly.

## Custom Control Center

Use `controlCenterSlot` for custom registrations, adapters, or event handling:

```tsx
import { ConfiguredControlCenter } from '@vezham/react/control-center'

const Layout = () => (
  <AppLayout
    navigationItems={navigationItems}
    controlCenterSlot={
      <ConfiguredControlCenter
        config={controlCenter}
        context={{ i18n: vxI18n }}
        onAction={handleControlAction}
        placement="right bottom"
      />
    }
  />
)
```

The layout forwards this element through desktop and mobile navigation. Lower
level footer and menu components still call their element prop `controlCenter`;
at the `AppLayout` boundary, `controlCenter` always means configuration.
`AppLayoutView` uses `controlCenterSlot` for its rendered element.

See [Control Center](./control-center.md) for tile configuration and
[the CLI baseline](../cli-template-baseline.md) for app ownership conventions.

## Motion

The desktop info panel animates with CSS transforms and opacity. Its width is
reserved during closing and released when the exit animation ends; width itself
is not animated. Closing content is inert immediately and unmounted after exit.
`prefers-reduced-motion` removes movement while retaining lifecycle cleanup.
Apps using Motion-based components can configure reduced motion at their
chosen boundary; `AppLayout` does not add a global Motion provider.
