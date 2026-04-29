import assert from "node:assert/strict";
import test from "node:test";

import { toProfileUser } from "./user.mapper.ts";

test("toProfileUser exposes only profile-safe fields", () => {
  const mobileVerifiedAt = new Date("2026-04-29T10:00:00.000Z");
  const profileCompletedAt = new Date("2026-04-29T10:05:00.000Z");

  const user = toProfileUser({
    avatarUrl: "https://cdn.example.com/avatar.jpg",
    branchId: "branch_1",
    email: "priya@example.com",
    id: "user_1",
    mobile: "9876543210",
    mobileVerifiedAt,
    name: "Priya",
    profileCompletedAt,
    role: "USER",
  });

  assert.deepEqual(user, {
    avatarUrl: "https://cdn.example.com/avatar.jpg",
    branchId: "branch_1",
    email: "priya@example.com",
    id: "user_1",
    mobile: "9876543210",
    mobileVerifiedAt,
    name: "Priya",
    profileCompletedAt,
    role: "USER",
  });
});
