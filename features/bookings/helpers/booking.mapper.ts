type BookingSlotInput = {
  availableStaffCount: number;
  endMinutes: number;
  startMinutes: number;
};

/**
 * Converts calculated slot minutes into the public slot grid API shape.
 */
export function toPublicBookingSlot(slot: BookingSlotInput) {
  return {
    available: slot.availableStaffCount > 0,
    availableStaffCount: slot.availableStaffCount,
    endTime: toTimeString(slot.endMinutes),
    startTime: toTimeString(slot.startMinutes),
  };
}

/**
 * Formats minutes after midnight as HH:mm:ss for API consumers.
 */
function toTimeString(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(
    2,
    "0",
  )}:00`;
}
