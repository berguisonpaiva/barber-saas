export type CanceledBy = "CUSTOMER" | "OWNER";

/** Tudo que um consumidor do evento precisa saber, congelado no instante do evento (RN-07). */
export interface AppointmentEventPayload {
  appointmentId: string;
  customerName: string;
  serviceName: string;
  professionalName: string;
  startsAt: string; // ISO UTC
  timeZone: string;
  canceledBy?: CanceledBy;
}

export interface AppointmentConfirmedEvent {
  type: "appointment.confirmed";
  payload: AppointmentEventPayload;
}

export interface AppointmentCanceledEvent {
  type: "appointment.canceled";
  payload: AppointmentEventPayload & { canceledBy: CanceledBy };
}

export type AppointmentEvent = AppointmentConfirmedEvent | AppointmentCanceledEvent;
