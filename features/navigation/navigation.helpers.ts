/**
 * Purpose: Navigation filtering helpers for role-aware route sections.
 * Responsibilities: remove links unavailable to the current role and omit empty sections.
 * Important notes: this helper preserves original section objects except for filtered item arrays.
 */
import type { NavSection, NavigationRole } from "./navigation.types";

/**
 * Filters navigation sections in one pass for the active role.
 */
export function filterNavSectionsByRole(
  sections: NavSection[],
  role?: NavigationRole,
) {
  return sections.reduce<NavSection[]>((visibleSections, section) => {
    const items = section.items.filter(
      (item) => !item.roles || Boolean(role && item.roles.includes(role)),
    );

    if (items.length > 0) {
      visibleSections.push({ ...section, items });
    }

    return visibleSections;
  }, []);
}
