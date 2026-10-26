-- GiST can compare the staff UUID string and the appointment time range together.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Adjacent appointments are allowed, but active appointments for the same
-- primary staff member must never overlap.
ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_staff_no_active_overlap"
  EXCLUDE USING GIST (
    "staffId" WITH =,
    tsrange("startTime", "endTime", '[)') WITH &&
  )
  WHERE (
    "staffId" IS NOT NULL
    AND "status" IN ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS')
  );
