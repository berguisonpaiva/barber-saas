import type { SelectedService } from "@/modules/scheduling/domain/service-selection";
import type { Appointment, AppointmentStatus } from "../../domain/appointment";
import type { AppointmentCanceledEvent, AppointmentConfirmedEvent, CanceledBy } from "../../domain/events";

export interface NewAppointmentRecord {
  id: string;
  tenantId: string;
  professionalId: string;
  /** Na ordem escolhida pelo cliente; preço, nome e duração abaixo são a combinação deles. */
  services: readonly SelectedService[];
  customer: { name: string; phone: string };
  startsAt: Date;
  endsAt: Date;
  status: "CONFIRMED";
  priceCents: number;
  serviceName: string;
  durationMinutes: number;
  cancelTokenHash: string;
  cancelTokenExpiresAt: Date;
  source: "PUBLIC_LINK" | "OWNER_PANEL";
  event: AppointmentConfirmedEvent;
}

export interface CancellationRecord {
  tenantId: string;
  appointmentId: string;
  by: CanceledBy;
  at: Date;
  event: AppointmentCanceledEvent;
}

export interface AttendanceRecord {
  tenantId: string;
  appointmentId: string;
  from: AppointmentStatus;
  to: "COMPLETED" | "NO_SHOW";
}

export interface AppointmentRepository {
  /**
   * Grava cliente (upsert por telefone), agendamento e evento de outbox na MESMA transação.
   * Deve lançar SlotUnavailableError se outro Confirmado do mesmo profissional se sobrepuser.
   */
  insert(record: NewAppointmentRecord): Promise<void>;
  /** Encontra o agendamento mesmo depois de cancelado: o hash do link não é apagado. */
  findByCancelTokenHash(tenantId: string, tokenHash: string): Promise<Appointment | null>;
  /**
   * Grava o cancelamento e o evento de outbox na mesma transação, só se o agendamento ainda estiver Confirmado.
   * "not-confirmed": outro pedido mudou o estado entre a leitura e a gravação.
   */
  recordCancellation(record: CancellationRecord): Promise<"recorded" | "not-confirmed">;
  /** Agendamento da barbearia pelo id (painel do proprietário); null se não existir nesta barbearia. */
  findForOwner(tenantId: string, appointmentId: string): Promise<Appointment | null>;
  /** Grava Atendido/Faltou só se o status ainda for `from`; "stale": outro pedido mudou o estado antes. */
  recordAttendance(record: AttendanceRecord): Promise<"recorded" | "stale">;
}
