import assert from "node:assert/strict";
import test from "node:test";

import { updateProfileSchema } from "../../../schema/users/schema.user.ts";

test("updateProfileSchema accepts single-field profile patches", () => {
  assert.deepEqual(updateProfileSchema.parse({ name: "Priya" }), {
    name: "Priya",
  });

  assert.deepEqual(updateProfileSchema.parse({ email: null }), {
    email: null,
  });

  assert.deepEqual(updateProfileSchema.parse({ branchId: "" }), {
    branchId: null,
  });

  assert.deepEqual(
    updateProfileSchema.parse({
      notificationPreferences: {
        whatsapp: true,
      },
    }),
    {
      notificationPreferences: {
        whatsapp: true,
      },
    },
  );
});

test("updateProfileSchema rejects empty profile patches", () => {
  const parsed = updateProfileSchema.safeParse({});

  assert.equal(parsed.success, false);
});
