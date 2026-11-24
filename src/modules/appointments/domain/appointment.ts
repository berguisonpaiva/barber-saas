import { canCustomerCancel } from "./cancellation-policy";
import {
  AppointmentClosedError,
  AttendanceTooEarlyError,
  CancellationWindowClosedError,
  InvalidCancelTokenError,
} from "./errors";
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

export type OwnerCancellation = CustomerCancellation;

/** Como o atendimento terminou, registrado pelo proprietário. */
export type AttendanceOutcome = "COMPLETED" | "NO_SHOW";

export type AttendanceChange =
  | { outcome: "changed"; from: AppointmentStatus; to: AttendanceOutcome }
  | { outcome: "unchanged" };

/** O que o painel oferece para um agendamento agora (tela P2). */
export interface OwnerActions {
  canRecordAttendance: boolean;
  canCancel: boolean;
}

/**
 * Atendido/Faltou: a partir do início, para Confirmado ou para corrigir um ao outro — nunca para Cancelado.
 * Cancelar: só Confirmado; Atendido e Faltou já encerraram o agendamento.
 */
export function ownerActionsFor(status: AppointmentStatus, startsAt: Date, at: Date): OwnerActions {
  return {
    canRecordAttendance: status !== "CANCELED" && at.getTime() >= startsAt.getTime(),
    canCancel: status === "CONFIRMED",
  };
}

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

  ownerActions(at: Date): OwnerActions {
    return ownerActionsFor(this.snapshot.status, this.snapshot.startsAt, at);
  }

  /** RN-06: o proprietário encerra o agendamento como Atendido ou Faltou (ou corrige um pelo outro). */
  recordAttendance(outcome: AttendanceOutcome, at: Date): AttendanceChange {
    const { status } = this.snapshot;
    if (status === "CANCELED") throw new AppointmentClosedError("Agendamento cancelado não pode ser marcado.");
    if (!this.ownerActions(at).canRecordAttendance) throw new AttendanceTooEarlyError();
    if (status === outcome) return { outcome: "unchanged" };
    return { outcome: "changed", from: status, to: outcome };
  }

  /** O proprietário cancela a qualquer momento enquanto Confirmado; repetir o pedido não é erro. */
  cancelByOwner(): OwnerCancellation {
    if (this.isCanceled()) return { outcome: "already-canceled" };
    if (this.snapshot.status !== "CONFIRMED") {
      throw new AppointmentClosedError("Agendamento já encerrado como Atendido ou Faltou não pode ser cancelado.");
    }
    return {
      outcome: "canceled",
      event: { type: "appointment.canceled", payload: { ...eventPayloadOf(this.snapshot), canceledBy: "OWNER" } },
    };
  }
}

function eventPayloadOf(details: BookingDetails): AppointmentEventPayload {
  const { id, customerName, serviceName, professionalName, startsAt, timeZone } = details;
  return { appointmentId: id, customerName, serviceName, professionalName, startsAt: startsAt.toISOString(), timeZone };
}
