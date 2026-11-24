import { AppError, ConflictError } from "@/shared/errors/app-error";

export class SlotUnavailableError extends ConflictError {
  constructor() {
    super("Esse horário acabou de ser ocupado. Escolha outro.", "SLOT_UNAVAILABLE");
  }
}

export class InvalidCancelTokenError extends AppError {
  constructor() {
    super("Link de cancelamento inválido ou expirado.", "INVALID_CANCEL_TOKEN", 404);
  }
}

export class CancellationWindowClosedError extends AppError {
  constructor(minutes: number) {
    super(
      `Cancelamento online só até ${Math.round(minutes / 60)}h antes. Fale com a barbearia.`,
      "CANCELLATION_WINDOW_CLOSED",
      409,
    );
  }
}

export class AppointmentNotFoundError extends AppError {
  constructor() {
    super("Agendamento não encontrado.", "APPOINTMENT_NOT_FOUND", 404);
  }
}

export class AppointmentClosedError extends ConflictError {
  constructor(message: string) {
    super(message, "APPOINTMENT_CLOSED");
  }
}

export class AttendanceTooEarlyError extends ConflictError {
  constructor() {
    super("Só dá para marcar Atendido ou Faltou a partir do horário marcado.", "ATTENDANCE_TOO_EARLY");
  }
}

export class BookingDisabledError extends AppError {
  constructor() {
    super("Esta barbearia não está recebendo agendamentos online no momento.", "BOOKING_DISABLED", 403);
  }
}
