import "server-only";
import { prisma } from "@/shared/database/prisma";
import { hasPgCode, PG_EXCLUSION_VIOLATION } from "@/shared/database/errors";
import { Appointment } from "../../domain/appointment";
import { SlotUnavailableError } from "../../domain/errors";
import type {
  AppointmentRepository,
  CancellationRecord,
  NewAppointmentRecord,
} from "../../application/ports/appointment-repository";

export class PrismaAppointmentRepository implements AppointmentRepository {
  async insert(record: NewAppointmentRecord): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        const customer = await tx.customer.upsert({
          where: { tenantId_phone: { tenantId: record.tenantId, phone: record.customer.phone } },
          create: { tenantId: record.tenantId, name: record.customer.name, phone: record.customer.phone },
          update: { name: record.customer.name },
          select: { id: true },
        });

        await tx.appointment.create({
          data: {
            id: record.id,
            tenantId: record.tenantId,
            professionalId: record.professionalId,
            serviceId: record.serviceId,
            customerId: customer.id,
            startsAt: record.startsAt,
            endsAt: record.endsAt,
            status: record.status,
            source: record.source,
            priceSnapshotCents: record.priceCents,
            serviceNameSnapshot: record.serviceName,
            durationSnapshotMinute: record.durationMinutes,
            customerNameSnapshot: record.customer.name,
            cancelTokenHash: record.cancelTokenHash,
            cancelTokenExpiresAt: record.cancelTokenExpiresAt,
          },
          select: { id: true },
        });

        await tx.outboxEvent.create({
          data: { tenantId: record.tenantId, type: record.event.type, payload: { ...record.event.payload } },
        });
      });
    } catch (error) {
      if (hasPgCode(error, PG_EXCLUSION_VIOLATION)) throw new SlotUnavailableError();
      throw error;
    }
  }

  async findByCancelTokenHash(tenantId: string, tokenHash: string): Promise<Appointment | null> {
    const appt = await prisma.appointment.findFirst({
      where: { tenantId, cancelTokenHash: tokenHash },
      select: {
        id: true,
        tenantId: true,
        status: true,
        startsAt: true,
        serviceNameSnapshot: true,
        customerNameSnapshot: true,
        professional: { select: { name: true } },
        tenant: { select: { timezone: true, cancellationWindowMinutes: true } },
      },
    });
    if (!appt) return null;
    return Appointment.restore({
      id: appt.id,
      tenantId: appt.tenantId,
      status: appt.status,
      startsAt: appt.startsAt,
      customerName: appt.customerNameSnapshot,
      serviceName: appt.serviceNameSnapshot,
      professionalName: appt.professional.name,
      timeZone: appt.tenant.timezone,
      cancellationWindowMinutes: appt.tenant.cancellationWindowMinutes,
    });
  }

  async recordCancellation(record: CancellationRecord): Promise<"recorded" | "not-confirmed"> {
    return prisma.$transaction(async (tx) => {
      const { count } = await tx.appointment.updateMany({
        where: { id: record.appointmentId, tenantId: record.tenantId, status: "CONFIRMED" },
        data: { status: "CANCELED", canceledAt: record.at, canceledBy: record.by },
      });
      if (count === 0) return "not-confirmed";

      await tx.outboxEvent.create({
        data: { tenantId: record.tenantId, type: record.event.type, payload: { ...record.event.payload } },
      });
      return "recorded";
    });
  }
}
