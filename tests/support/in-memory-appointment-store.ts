import { hashToken } from "@/shared/security/token";
import { Appointment, type AppointmentSnapshot, type AppointmentStatus } from "@/modules/appointments/domain/appointment";
import type { AppointmentEvent } from "@/modules/appointments/domain/events";
import { SlotUnavailableError } from "@/modules/appointments/domain/errors";
import type {
  AppointmentRepository,
  AttendanceRecord,
  CancellationRecord,
  NewAppointmentRecord,
} from "@/modules/appointments/application/ports/appointment-repository";
import type { MinuteRange } from "@/modules/scheduling/domain/availability";
import type { AvailabilityExceptionFact, DayFacts, OfferFacts } from "@/modules/scheduling/domain/day-facts";
import type { SchedulingRepository, SchedulingSettings } from "@/modules/scheduling/application/ports/scheduling-repository";

interface BarbeariaSettings extends SchedulingSettings {
  cancellationWindowMinutes: number;
}

interface StoredProfessional {
  name: string;
  weekly: Partial<Record<number, MinuteRange[]>>;
  active?: boolean;
}

interface StoredService {
  name: string;
  priceCents: number;
  durationMinutes: number;
  professionalIds: readonly string[];
  active?: boolean;
}

interface StoredAppointment {
  snapshot: AppointmentSnapshot;
  professionalId: string;
  endsAt: Date;
  cancelTokenHash: string;
}

export type NewStoredAppointment = Omit<AppointmentSnapshot, "id" | "status"> & {
  cancelToken: string;
  status?: AppointmentStatus;
  professionalId?: string;
  endsAt?: Date;
};

const key = (tenantId: string, id: string) => `${tenantId}:${id}`;

/**
 * Adapter em memória das portas de Agendamento e de Horário livre, com um estado só, como o banco.
 * É o segundo adapter que torna o seam real; aplica a mesma regra de sobreposição da exclusion constraint.
 */
export class InMemoryAppointmentStore implements AppointmentRepository, SchedulingRepository {
  private readonly barbearias = new Map<string, BarbeariaSettings>();
  private readonly professionals = new Map<string, StoredProfessional>();
  private readonly services = new Map<string, StoredService>();
  private readonly appointments = new Map<string, StoredAppointment>();
  private readonly exceptions = new Map<string, AvailabilityExceptionFact[]>();
  private readonly customers = new Map<string, string>();
  private readonly events: AppointmentEvent[] = [];
  private nextId = 1;

  get outbox(): readonly AppointmentEvent[] {
    return this.events;
  }

  addBarbearia({ tenantId, ...settings }: BarbeariaSettings & { tenantId: string }): void {
    this.barbearias.set(tenantId, settings);
  }

  addProfessional({ tenantId, id, ...professional }: StoredProfessional & { tenantId: string; id: string }): void {
    this.professionals.set(key(tenantId, id), professional);
  }

  addService({ tenantId, id, ...service }: StoredService & { tenantId: string; id: string }): void {
    this.services.set(key(tenantId, id), service);
  }

  addException({
    tenantId,
    professionalId,
    date,
    ...exception
  }: AvailabilityExceptionFact & { tenantId: string; professionalId: string; date: string }): void {
    const dayKey = key(tenantId, `${professionalId}:${date}`);
    this.exceptions.set(dayKey, [...(this.exceptions.get(dayKey) ?? []), exception]);
  }

  addAppointment({
    cancelToken,
    status = "CONFIRMED",
    professionalId = "prof-qualquer",
    endsAt,
    ...rest
  }: NewStoredAppointment): string {
    const id = `appt-${this.nextId++}`;
    this.appointments.set(id, {
      snapshot: { ...rest, id, status },
      professionalId,
      endsAt: endsAt ?? new Date(rest.startsAt.getTime() + 30 * 60_000),
      cancelTokenHash: hashToken(cancelToken),
    });
    return id;
  }

  async getSettings(tenantId: string): Promise<SchedulingSettings | null> {
    return this.barbearias.get(tenantId) ?? null;
  }

  async findOffer(tenantId: string, professionalId: string, serviceId: string): Promise<OfferFacts | null> {
    const service = this.services.get(key(tenantId, serviceId));
    const professional = this.professionals.get(key(tenantId, professionalId));
    if (!service || !professional || !service.professionalIds.includes(professionalId)) return null;
    const { name, priceCents, durationMinutes, active = true } = service;
    return {
      service: { id: serviceId, name, priceCents, durationMinutes, active },
      professional: { name: professional.name, active: professional.active ?? true },
    };
  }

  async getDayFacts(params: {
    tenantId: string;
    professionalId: string;
    date: string;
    weekday: number;
    dayStartUtc: Date;
    dayEndUtc: Date;
  }): Promise<DayFacts> {
    const professional = this.professionals.get(key(params.tenantId, params.professionalId));
    const appointments = [...this.appointments.values()]
      .filter((a) => a.snapshot.tenantId === params.tenantId && a.professionalId === params.professionalId)
      .filter((a) => a.snapshot.startsAt < params.dayEndUtc && a.endsAt > params.dayStartUtc)
      .map((a) => ({ status: a.snapshot.status, start: a.snapshot.startsAt, end: a.endsAt }));
    return {
      workingPeriods: professional?.weekly[params.weekday] ?? [],
      exceptions: this.exceptions.get(key(params.tenantId, `${params.professionalId}:${params.date}`)) ?? [],
      appointments,
    };
  }

  async insert(record: NewAppointmentRecord): Promise<void> {
    const overlaps = this.confirmedOf(record.tenantId, record.professionalId).some(
      (a) => record.startsAt < a.endsAt && record.endsAt > a.snapshot.startsAt,
    );
    if (overlaps) throw new SlotUnavailableError();

    const barbearia = this.barbearias.get(record.tenantId);
    if (!barbearia) throw new Error(`Barbearia ${record.tenantId} não cadastrada no adapter em memória.`);

    this.customers.set(key(record.tenantId, record.customer.phone), record.customer.name);
    this.appointments.set(record.id, {
      snapshot: {
        id: record.id,
        tenantId: record.tenantId,
        status: record.status,
        startsAt: record.startsAt,
        customerName: record.customer.name,
        serviceName: record.serviceName,
        professionalName: record.event.payload.professionalName,
        timeZone: barbearia.timeZone,
        cancellationWindowMinutes: barbearia.cancellationWindowMinutes,
      },
      professionalId: record.professionalId,
      endsAt: record.endsAt,
      cancelTokenHash: record.cancelTokenHash,
    });
    this.events.push(record.event);
  }

  async findByCancelTokenHash(tenantId: string, tokenHash: string): Promise<Appointment | null> {
    for (const stored of this.appointments.values()) {
      if (stored.snapshot.tenantId === tenantId && stored.cancelTokenHash === tokenHash) {
        return Appointment.restore(stored.snapshot);
      }
    }
    return null;
  }

  async recordCancellation(record: CancellationRecord): Promise<"recorded" | "not-confirmed"> {
    const stored = this.appointments.get(record.appointmentId);
    if (!stored || stored.snapshot.tenantId !== record.tenantId) return "not-confirmed";
    if (stored.snapshot.status !== "CONFIRMED") return "not-confirmed";

    stored.snapshot = { ...stored.snapshot, status: "CANCELED" };
    this.events.push(record.event);
    return "recorded";
  }

  async findForOwner(tenantId: string, appointmentId: string): Promise<Appointment | null> {
    const stored = this.appointments.get(appointmentId);
    return stored && stored.snapshot.tenantId === tenantId ? Appointment.restore(stored.snapshot) : null;
  }

  async recordAttendance(record: AttendanceRecord): Promise<"recorded" | "stale"> {
    const stored = this.appointments.get(record.appointmentId);
    if (!stored || stored.snapshot.tenantId !== record.tenantId || stored.snapshot.status !== record.from) return "stale";
    stored.snapshot = { ...stored.snapshot, status: record.to };
    return "recorded";
  }

  statusOf(appointmentId: string): AppointmentStatus | undefined {
    return this.appointments.get(appointmentId)?.snapshot.status;
  }

  private confirmedOf(tenantId: string, professionalId: string): StoredAppointment[] {
    return [...this.appointments.values()].filter(
      (a) => a.snapshot.tenantId === tenantId && a.professionalId === professionalId && a.snapshot.status === "CONFIRMED",
    );
  }
}
