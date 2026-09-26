import { publicNav } from "./nav.config";
import { NavItem } from "./nav-item";

/**
 * Horizontal navigation for large screens.
 *
 * Why:
 * No "use client" directive — this component has no hooks and no browser
 * APIs. It maps over static data and renders client NavItem children, which
 * is the canonical Next.js pattern: keep the wrapper on the server, push
 * interactivity down to the smallest possible leaf.
 *
 * Visibility is a CSS concern (`hidden lg:flex`), not a JS one — a
 * server-rendered element that never mounts on mobile costs nothing.
 */
export function DesktopNav() {
  return (
    <nav
      aria-label="Primary"
      className="hidden items-center gap-6 lg:flex"
    >
      {publicNav.map((item) => (
        <NavItem key={item.href} item={item} variant="desktop" />
      ))}
    </nav>
  );
}
