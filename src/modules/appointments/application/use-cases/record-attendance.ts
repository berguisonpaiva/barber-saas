import type { Clock } from "@/shared/utils/clock";
import type { AttendanceOutcome } from "../../domain/appointment";
import { AppointmentNotFoundError } from "../../domain/errors";
import type { AppointmentRepository } from "../ports/appointment-repository";

/** RN-06 (tela P2): o proprietário marca Atendido ou Faltou. tenantId vem da sessão. */
export class RecordAttendance {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: { tenantId: string; appointmentId: string; outcome: AttendanceOutcome }): Promise<void> {
    const appointment = await this.appointments.findForOwner(input.tenantId, input.appointmentId);
    if (!appointment) throw new AppointmentNotFoundError();

    const change = appointment.recordAttendance(input.outcome, this.clock.now());
    if (change.outcome === "unchanged") return;

    const recorded = await this.appointments.recordAttendance({
      tenantId: input.tenantId,
      appointmentId: input.appointmentId,
      from: change.from,
      to: change.to,
    });
    if (recorded === "stale") await this.retryOnFreshState(input);
  }

  /** Outro pedido mudou o status entre a leitura e a gravação: decide de novo sobre o estado atual. */
  private async retryOnFreshState(input: { tenantId: string; appointmentId: string; outcome: AttendanceOutcome }) {
    const current = await this.appointments.findForOwner(input.tenantId, input.appointmentId);
    if (!current) throw new AppointmentNotFoundError();
    const change = current.recordAttendance(input.outcome, this.clock.now());
    if (change.outcome === "unchanged") return;
    await this.appointments.recordAttendance({ ...input, from: change.from, to: change.to });
  }
}
