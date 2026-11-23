import { dayMonth, spokenTime } from "@/shared/time/format";
import type { AppointmentEventPayload, OutboxEventType } from "./events";

export interface PushMessage {
  title: string;
  body: string;
  url: string;
  tag: string;
}

/** Texto das notificações conforme PRD §11. */
export function buildPushMessage(type: OutboxEventType, p: AppointmentEventPayload): PushMessage {
  const startsAt = new Date(p.startsAt);
  const date = dayMonth(startsAt, p.timeZone);
  const time = spokenTime(startsAt, p.timeZone);
  const url = `/painel/agenda/${p.appointmentId}`;
  if (type === "appointment.confirmed") {
    return {
      title: "Novo agendamento",
      body: `${p.customerName} agendou ${p.serviceName} para ${date} às ${time} com ${p.professionalName}.`,
      url,
      tag: `appointment-${p.appointmentId}`,
    };
  }
  return {
    title: "Agendamento cancelado",
    body: `O horário de ${date} às ${time} (${p.professionalName}) foi liberado após cancelamento.`,
    url,
    tag: `appointment-${p.appointmentId}`,
  };
}
