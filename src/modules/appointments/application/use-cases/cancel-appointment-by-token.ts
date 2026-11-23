import type { Clock } from "@/shared/utils/clock";
import { hashToken } from "@/shared/security/token";
import { InvalidCancelTokenError } from "../../domain/errors";
import type { AppointmentRepository } from "../ports/appointment-repository";

export interface CancelByTokenOutput {
  appointmentId: string;
  /** true quando o agendamento já estava cancelado: repetir o pedido não é erro. */
  alreadyCanceled: boolean;
}

/** RN-08: cancelamento público com token de escopo restrito ao agendamento. */
export class CancelAppointmentByToken {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: { tenantId: string; token: string }): Promise<CancelByTokenOutput> {
    const now = this.clock.now();
    const tokenHash = hashToken(input.token);
    const appointment = await this.appointments.findByCancelTokenHash(input.tenantId, tokenHash);
    if (!appointment) throw new InvalidCancelTokenError();

    const cancellation = appointment.cancelByCustomer(now);
    if (cancellation.outcome === "already-canceled") return { appointmentId: appointment.id, alreadyCanceled: true };

    const recorded = await this.appointments.recordCancellation({
      tenantId: input.tenantId,
      appointmentId: appointment.id,
      by: "CUSTOMER",
      at: now,
      event: cancellation.event,
    });
    if (recorded === "recorded") return { appointmentId: appointment.id, alreadyCanceled: false };

    return this.resolveConcurrentChange(input.tenantId, tokenHash);
  }

  private async resolveConcurrentChange(tenantId: string, tokenHash: string): Promise<CancelByTokenOutput> {
    const current = await this.appointments.findByCancelTokenHash(tenantId, tokenHash);
    if (!current?.isCanceled()) throw new InvalidCancelTokenError();
    return { appointmentId: current.id, alreadyCanceled: true };
  }
}
