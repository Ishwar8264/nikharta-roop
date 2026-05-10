import type { NavSection, NavigationRole } from "./navigation.types";

export function filterNavSectionsByRole(
  sections: NavSection[],
  role?: NavigationRole,
) {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.roles || Boolean(role && item.roles.includes(role)),
      ),
    }))
    .filter((section) => section.items.length > 0);
}
