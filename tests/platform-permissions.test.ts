import { expect, it } from "vitest";
import { canAccessAdmin, hasPermission } from "../src/lib/auth/permissions";

it("limits content admins to editorial work", () => {
  expect(hasPermission("CONTENT_ADMIN", "content.manage")).toBe(true);
  for (const permission of ["salons.verify", "users.manage", "roles.assign", "platform.manage"] as const) {
    expect(hasPermission("CONTENT_ADMIN", permission)).toBe(false);
  }
});
it("allows operational admins to review salons without assigning roles", () => {
  expect(hasPermission("ADMIN", "salons.verify")).toBe(true);
  expect(hasPermission("ADMIN", "users.manage")).toBe(true);
  expect(hasPermission("ADMIN", "roles.assign")).toBe(false);
  expect(hasPermission("SUPER_ADMIN", "roles.assign")).toBe(true);
});
it("denies ordinary users, salon roles and unknown roles platform access", () => {
  for (const role of ["USER", "OWNER", "MANAGER", "STAFF", "unknown", "toString", ""]) {
    expect(canAccessAdmin(role)).toBe(false);
    expect(hasPermission(role, "content.manage")).toBe(false);
    expect(hasPermission(role, "roles.assign")).toBe(false);
  }
});
