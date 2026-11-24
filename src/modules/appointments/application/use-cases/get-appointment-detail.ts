import "server-only";
import { prisma } from "@/shared/database/prisma";
import { systemClock, type Clock } from "@/shared/utils/clock";
import { ownerActionsFor } from "../../domain/appointment";
import { AppointmentNotFoundError } from "../../domain/errors";

/** Tela P2: tudo o que o proprietário vê de um agendamento e o que pode fazer com ele agora. */
export async function getAppointmentDetail(tenantId: string, appointmentId: string, clock: Clock = systemClock) {
  const appointment = await prisma.appointment.findFirst({
    where: { tenantId, id: appointmentId },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      status: true,
      source: true,
      priceSnapshotCents: true,
      serviceNameSnapshot: true,
      durationSnapshotMinute: true,
      customerNameSnapshot: true,
      canceledAt: true,
      canceledBy: true,
      createdAt: true,
      professional: { select: { name: true } },
      customer: { select: { id: true, phone: true } },
      tenant: { select: { timezone: true } },
    },
  });
  if (!appointment) throw new AppointmentNotFoundError();

  const { tenant, ...rest } = appointment;
  return {
    ...rest,
    timeZone: tenant.timezone,
    actions: ownerActionsFor(appointment.status, appointment.startsAt, clock.now()),
  };
}

export type AppointmentDetail = Awaited<ReturnType<typeof getAppointmentDetail>>;
