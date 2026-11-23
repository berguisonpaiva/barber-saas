import { canCustomerCancel } from "./cancellation-policy";
import { CancellationWindowClosedError, InvalidCancelTokenError } from "./errors";
import type { AppointmentCanceledEvent, AppointmentConfirmedEvent, AppointmentEventPayload } from "./events";

export type AppointmentStatus = "CONFIRMED" | "COMPLETED" | "CANCELED" | "NO_SHOW";

/** Só Confirmado ocupa o tempo do profissional; Atendido, Faltou e Cancelado liberam o que resta. */
export function occupiesProfessionalTime(status: AppointmentStatus): boolean {
  return status === "CONFIRMED";
}

export interface AppointmentSnapshot {
  id: string;
  tenantId: string;
  status: AppointmentStatus;
  startsAt: Date;
  customerName: string;
  serviceName: string;
  professionalName: string;
  timeZone: string;
  cancellationWindowMinutes: number;
}

export type CustomerCancellation =
  | { outcome: "canceled"; event: AppointmentCanceledEvent }
  | { outcome: "already-canceled" };

export type BookingDetails = Pick<
  AppointmentSnapshot,
  "id" | "startsAt" | "customerName" | "serviceName" | "professionalName" | "timeZone"
>;

export interface Booking {
  status: "CONFIRMED";
  event: AppointmentConfirmedEvent;
}

/** O que o cliente vê pelo Link de cancelamento; "closed" = atendido ou faltou (o link não vale mais). */
export interface CustomerAppointmentView {
  appointmentId: string;
  customerName: string;
  serviceName: string;
  professionalName: string;
  startsAt: Date;
  timeZone: string;
  cancellationWindowMinutes: number;
  state: "cancellable" | "window-closed" | "canceled" | "closed";
}

export class Appointment {
  private constructor(private readonly snapshot: Readonly<AppointmentSnapshot>) {}

  /** RN-06: o agendamento nasce Confirmado, sem aprovação manual. */
  static book(details: BookingDetails): Booking {
    return { status: "CONFIRMED", event: { type: "appointment.confirmed", payload: eventPayloadOf(details) } };
  }

  static restore(snapshot: AppointmentSnapshot): Appointment {
    return new Appointment({ ...snapshot, startsAt: new Date(snapshot.startsAt) });
  }

  get id(): string {
    return this.snapshot.id;
  }

  customerView(at: Date): CustomerAppointmentView {
    const { id, customerName, serviceName, professionalName, startsAt, timeZone, cancellationWindowMinutes } = this.snapshot;
    return {
      appointmentId: id,
      customerName,
      serviceName,
      professionalName,
      startsAt: new Date(startsAt),
      timeZone,
      cancellationWindowMinutes,
      state: this.customerState(at),
    };
  }

  private customerState(at: Date): CustomerAppointmentView["state"] {
    if (this.isCanceled()) return "canceled";
    if (this.snapshot.status !== "CONFIRMED") return "closed";
    const { startsAt, cancellationWindowMinutes } = this.snapshot;
    return canCustomerCancel(startsAt, at, cancellationWindowMinutes) ? "cancellable" : "window-closed";
  }

  isCanceled(): boolean {
    return this.snapshot.status === "CANCELED";
  }

  /** RN-08: o cliente cancela sozinho só enquanto a Janela de cancelamento estiver aberta. */
  cancelByCustomer(at: Date): CustomerCancellation {
    if (this.isCanceled()) return { outcome: "already-canceled" };
    if (this.snapshot.status !== "CONFIRMED") throw new InvalidCancelTokenError();

    const { startsAt, cancellationWindowMinutes } = this.snapshot;
    if (!canCustomerCancel(startsAt, at, cancellationWindowMinutes)) {
      throw new CancellationWindowClosedError(cancellationWindowMinutes);
    }

    return {
      outcome: "canceled",
      event: { type: "appointment.canceled", payload: { ...eventPayloadOf(this.snapshot), canceledBy: "CUSTOMER" } },
    };
  }
}

function eventPayloadOf(details: BookingDetails): AppointmentEventPayload {
  const { id, customerName, serviceName, professionalName, startsAt, timeZone } = details;
  return { appointmentId: id, customerName, serviceName, professionalName, startsAt: startsAt.toISOString(), timeZone };
}
