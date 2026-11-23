import type { AppointmentEvent } from "@/modules/appointments/domain/events";

/** Eventos gravados no outbox (RN-07). Quem os define é o Agendamento; Notificações só os consome. */
export type OutboxEventType = AppointmentEvent["type"];

export type { AppointmentEventPayload } from "@/modules/appointments/domain/events";
