import type { Clock } from "@/shared/utils/clock";
import { AppointmentClosedError, AppointmentNotFoundError } from "../../domain/errors";
import type { AppointmentRepository } from "../ports/appointment-repository";

/**
 * Tela P2: o proprietário cancela (sem janela de cancelamento). Libera o horário e grava o evento
 * de outbox na mesma transação (RN-07). Repetir o pedido sobre um cancelado não é erro.
 */
export class CancelAppointmentByOwner {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: { tenantId: string; appointmentId: string }): Promise<{ alreadyCanceled: boolean }> {
    const appointment = await this.appointments.findForOwner(input.tenantId, input.appointmentId);
    if (!appointment) throw new AppointmentNotFoundError();

    const cancellation = appointment.cancelByOwner();
    if (cancellation.outcome === "already-canceled") return { alreadyCanceled: true };

    const recorded = await this.appointments.recordCancellation({
      tenantId: input.tenantId,
      appointmentId: input.appointmentId,
      by: "OWNER",
      at: this.clock.now(),
      event: cancellation.event,
    });
    if (recorded === "recorded") return { alreadyCanceled: false };

    const current = await this.appointments.findForOwner(input.tenantId, input.appointmentId);
    if (current?.isCanceled()) return { alreadyCanceled: true };
    throw new AppointmentClosedError("O agendamento mudou de situação. Atualize a página.");
  }
}
