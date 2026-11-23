import type { Clock } from "@/shared/utils/clock";
import { hashToken } from "@/shared/security/token";
import type { CustomerAppointmentView } from "../../domain/appointment";
import type { AppointmentRepository } from "../ports/appointment-repository";

export type CancelLinkView = Omit<CustomerAppointmentView, "state"> & {
  state: Exclude<CustomerAppointmentView["state"], "closed">;
};

/** Tela C6: o que o Link de cancelamento mostra antes de confirmar. null = link inválido (RN-08). */
export class ViewAppointmentByCancelLink {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: { tenantId: string; token: string }): Promise<CancelLinkView | null> {
    const appointment = await this.appointments.findByCancelTokenHash(input.tenantId, hashToken(input.token));
    if (!appointment) return null;
    const view = appointment.customerView(this.clock.now());
    if (view.state === "closed") return null;
    return { ...view, state: view.state };
  }
}
