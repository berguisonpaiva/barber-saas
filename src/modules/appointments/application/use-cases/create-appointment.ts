import { randomUUID } from "node:crypto";
import { NotFoundError, ValidationError } from "@/shared/errors/app-error";
import { generateToken, hashToken } from "@/shared/security/token";
import { normalizeBrazilPhone } from "@/shared/utils/phone";
import { LocalDay } from "@/shared/time/local-day";
import type { GetAvailableSlots } from "@/modules/scheduling/application/use-cases/get-available-slots";
import type { SchedulingRepository } from "@/modules/scheduling/application/ports/scheduling-repository";
import { Appointment } from "../../domain/appointment";
import { SlotUnavailableError } from "../../domain/errors";
import type { AppointmentRepository } from "../ports/appointment-repository";

export interface CreateAppointmentInput {
  tenantId: string;
  professionalId: string;
  serviceIds: readonly string[];
  startsAt: Date;
  customer: { name: string; phone: string };
  source?: "PUBLIC_LINK" | "OWNER_PANEL";
}

export interface CreateAppointmentOutput {
  appointmentId: string;
  startsAt: Date;
  endsAt: Date;
  /** Token em texto puro: vai SOMENTE no link de cancelamento entregue ao cliente. */
  cancelToken: string;
}

/** Caso de uso central (RF-10). Confirmação automática após validar disponibilidade (RN-06). */
export class CreateAppointment {
  constructor(
    private readonly scheduling: SchedulingRepository,
    private readonly getAvailableSlots: GetAvailableSlots,
    private readonly appointments: AppointmentRepository,
  ) {}

  async execute(input: CreateAppointmentInput): Promise<CreateAppointmentOutput> {
    const name = input.customer.name.trim();
    if (name.length < 2) throw new ValidationError("Informe seu nome.");
    const phone = normalizeBrazilPhone(input.customer.phone);
    if (!phone) throw new ValidationError("Informe um WhatsApp válido com DDD.");

    const settings = await this.scheduling.getSettings(input.tenantId);
    if (!settings) throw new NotFoundError("Barbearia não encontrada.");

    // 1ª barreira: o horário precisa estar entre os livres calculados agora.
    const date = LocalDay.of(input.startsAt, settings.timeZone).toString();
    const { combination, professionalName, slots } = await this.getAvailableSlots.execute({
      tenantId: input.tenantId,
      professionalId: input.professionalId,
      serviceIds: input.serviceIds,
      date,
    });
    if (!slots.some((s) => s.getTime() === input.startsAt.getTime())) throw new SlotUnavailableError();

    const id = randomUUID();
    const endsAt = new Date(input.startsAt.getTime() + combination.durationMinutes * 60_000);
    const cancelToken = generateToken();
    const booking = Appointment.book({
      id,
      startsAt: input.startsAt,
      customerName: name,
      serviceName: combination.name,
      professionalName,
      timeZone: settings.timeZone,
    });

    // 2ª barreira: a exclusion constraint do banco resolve corridas entre requisições.
    await this.appointments.insert({
      id,
      tenantId: input.tenantId,
      professionalId: input.professionalId,
      services: combination.services,
      customer: { name, phone },
      startsAt: input.startsAt,
      endsAt,
      status: booking.status,
      priceCents: combination.priceCents,
      serviceName: combination.name,
      durationMinutes: combination.durationMinutes,
      cancelTokenHash: hashToken(cancelToken),
      cancelTokenExpiresAt: endsAt, // o link vale até o fim do atendimento
      source: input.source ?? "PUBLIC_LINK",
      event: booking.event,
    });

    return { appointmentId: id, startsAt: input.startsAt, endsAt, cancelToken };
  }
}
