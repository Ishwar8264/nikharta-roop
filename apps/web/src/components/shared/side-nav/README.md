# SideNav

Render this shared navigation from a Server Component. The shell has no client
hooks; the existing `NavLink` handles active routes and navigation status.

```tsx
import { Calendar, LayoutDashboard } from "lucide-react";
import { SideNav } from "@/components/shared/side-nav";
import { routes } from "@/config/routes";

<SideNav
  aria-label="Account navigation"
  header={<h2>My account</h2>}
  items={[
    {
      href: routes.dashboard,
      label: "Overview",
      icon: <LayoutDashboard className="size-4" />,
      matchNested: false,
    },
    {
      href: routes.appointments,
      label: "Appointments",
      icon: <Calendar className="size-4" />,
      badge: 3,
    },
  ]}
  footer={<p>Need help? Contact support.</p>}
  linkDefaults={{ size: "md", pendingLabel: "Opening page" }}
/>
```

- Supply either `items` or `groups`. Groups have `id`, optional `label`, `items`,
  and optional `className`.
- `orientation` accepts `vertical`, `horizontal`, or `responsive` (the default:
  horizontal on mobile, vertical from `md`). The caller controls width, sticky
  positioning, and the surrounding page layout.
- `header` and `footer` accept rendered nodes. `className`, `listClassName`, and
  `groupLabelClassName` customize the shell. Standard `<nav>` attributes pass through.
- Each item accepts an optional `description` displayed beneath its label.
- `linkDefaults` configures shared `NavLink` props; individual items override them.
  This includes `prefetch`, `replace`, `scroll`, `target`, `matchNested`,
  `markActive`, `activeClassName`, and pending indicator options. Use `id` when
  multiple items share a destination. Use `markActive: false` for external links.
- Pending feedback uses Next.js `useLinkStatus` inside the link. Prefetched
  destinations may skip pending status. Route-level `loading.tsx` still owns page
  loading UI. `pendingIndicator` accepts a rendered visual node, `pendingLabel`
  supplies accessible status text, and `showSpinner: false` disables feedback.
  The default status slot reserves space to prevent navigation layout shifts.
- Build and permission-filter items in the caller. Pass rendered icons, not icon
  component functions, across the server/client boundary. Event callbacks in
  `linkDefaults` or items require a client caller; a Server Component must pass
  serializable props and rendered slots instead.

This component does not add a mobile drawer or collapse state. Those interactions
can wrap the navigation when a particular feature needs them.
