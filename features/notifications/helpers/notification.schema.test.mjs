import assert from "node:assert/strict";
import test from "node:test";

import {
  createNotificationSchema,
  listNotificationsQuerySchema,
  updateNotificationSchema,
} from "../../../schema/notifications/schema.notification.ts";

test("listNotificationsQuerySchema coerces limit", () => {
  assert.deepEqual(listNotificationsQuerySchema.parse({ limit: "25" }), {
    limit: 25,
  });
});

test("createNotificationSchema accepts notification payloads", () => {
  const parsed = createNotificationSchema.parse({
    channel: "WHATSAPP",
    messageHi: "आपकी बुकिंग कन्फर्म है",
    recipient: "9876543210",
    trigger: "BOOKING_CONFIRMED",
  });

  assert.equal(parsed.channel, "WHATSAPP");
});

test("updateNotificationSchema rejects empty patches", () => {
  assert.equal(updateNotificationSchema.safeParse({}).success, false);
});
