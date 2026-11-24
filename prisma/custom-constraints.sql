CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_time_range_check" CHECK ("endsAt" > "startsAt");

-- RN-05: sem sobreposição para o mesmo profissional enquanto CONFIRMED.
-- Intervalo semiaberto [início, fim): 09:00–09:30 e 09:30–10:00 não conflitam.
ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_no_overlap"
  EXCLUDE USING gist (
    "tenantId" WITH =,
    "professionalId" WITH =,
    tstzrange("startsAt", "endsAt", '[)') WITH &&
  ) WHERE ("status" = 'CONFIRMED');

ALTER TABLE "Service"
  ADD CONSTRAINT "Service_values_check" CHECK ("priceCents" >= 0 AND "durationMinutes" > 0);

ALTER TABLE "AvailabilityRule"
  ADD CONSTRAINT "AvailabilityRule_range_check"
  CHECK ("weekday" BETWEEN 0 AND 6 AND "startMinute" >= 0 AND "endMinute" <= 1440 AND "endMinute" > "startMinute");

ALTER TABLE "AppointmentService"
  ADD CONSTRAINT "AppointmentService_values_check"
  CHECK ("position" >= 0 AND "priceSnapshotCents" >= 0 AND "durationSnapshotMinute" > 0);
