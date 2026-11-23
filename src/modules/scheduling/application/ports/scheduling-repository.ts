import type { DayFacts, OfferFacts } from "../../domain/day-facts";

export interface SchedulingSettings {
  timeZone: string;
  slotIntervalMinutes: number;
  minAdvanceMinutes: number;
  maxAdvanceDays: number;
}

export interface SchedulingService {
  id: string;
  name: string;
  priceCents: number;
  durationMinutes: number;
}

/**
 * Porta de leitura do Horário livre: devolve fatos, sem aplicar regras de domínio.
 * Toda consulta é obrigatoriamente filtrada por tenantId.
 */
export interface SchedulingRepository {
  getSettings(tenantId: string): Promise<SchedulingSettings | null>;
  /** Serviço e profissional com o indicador de ativo; null se o profissional não executa o serviço. */
  findOffer(tenantId: string, professionalId: string, serviceId: string): Promise<OfferFacts | null>;
  /** Expediente do dia da semana, exceções da data e agendamentos de qualquer estado que tocam o dia. */
  getDayFacts(params: {
    tenantId: string;
    professionalId: string;
    date: string;
    weekday: number;
    dayStartUtc: Date;
    dayEndUtc: Date;
  }): Promise<DayFacts>;
}
