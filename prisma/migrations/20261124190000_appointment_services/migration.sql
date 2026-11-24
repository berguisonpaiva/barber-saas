-- CreateIndex
CREATE UNIQUE INDEX "Appointment_tenantId_id_key" ON "Appointment"("tenantId", "id");

-- CreateTable
CREATE TABLE "AppointmentService" (
    "tenantId" UUID NOT NULL,
    "appointmentId" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "serviceNameSnapshot" TEXT NOT NULL,
    "priceSnapshotCents" INTEGER NOT NULL,
    "durationSnapshotMinute" INTEGER NOT NULL,

    CONSTRAINT "AppointmentService_pkey" PRIMARY KEY ("tenantId","appointmentId","serviceId")
);

-- CreateIndex
CREATE INDEX "AppointmentService_tenantId_serviceId_idx" ON "AppointmentService"("tenantId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentService_tenantId_appointmentId_position_key" ON "AppointmentService"("tenantId", "appointmentId", "position");

-- AddForeignKey
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_tenantId_appointmentId_fkey" FOREIGN KEY ("tenantId", "appointmentId") REFERENCES "Appointment"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_tenantId_serviceId_fkey" FOREIGN KEY ("tenantId", "serviceId") REFERENCES "Service"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CHECKs de consistência (o Prisma não expressa no schema)
ALTER TABLE "AppointmentService"
  ADD CONSTRAINT "AppointmentService_values_check"
  CHECK ("position" >= 0 AND "priceSnapshotCents" >= 0 AND "durationSnapshotMinute" > 0);

-- Backfill: cada agendamento existente passa a ter o seu único serviço na posição 0.
INSERT INTO "AppointmentService" ("tenantId", "appointmentId", "serviceId", "position", "serviceNameSnapshot", "priceSnapshotCents", "durationSnapshotMinute")
SELECT "tenantId", "id", "serviceId", 0, "serviceNameSnapshot", "priceSnapshotCents", "durationSnapshotMinute"
FROM "Appointment";

-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_tenantId_serviceId_fkey";

-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "serviceId";
