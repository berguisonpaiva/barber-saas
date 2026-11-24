/** Rótulos e tons das situações do agendamento, com os termos do glossário (CONTEXT.md). */
export const APPOINTMENT_STATUS_UI = {
  CONFIRMED: { label: "Confirmado", tone: "accent" },
  COMPLETED: { label: "Atendido", tone: "success" },
  NO_SHOW: { label: "Faltou", tone: "neutral" },
  CANCELED: { label: "Cancelado", tone: "danger" },
} as const;

export type AppointmentStatusKey = keyof typeof APPOINTMENT_STATUS_UI;
