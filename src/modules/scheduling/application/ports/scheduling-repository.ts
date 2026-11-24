import type { DayFacts, OfferFacts } from "../../domain/day-facts";

export interface SchedulingSettings {
  timeZone: string;
  slotIntervalMinutes: number;
  minAdvanceMinutes: number;
  maxAdvanceDays: number;
}

/**
 * Porta de leitura do Horário livre: devolve fatos, sem aplicar regras de domínio.
 * Toda consulta é obrigatoriamente filtrada por tenantId.
 */
export interface SchedulingRepository {
  getSettings(tenantId: string): Promise<SchedulingSettings | null>;
  /**
   * Serviços (na ordem dos ids) e profissional com o indicador de ativo;
   * null se o profissional não executa algum dos serviços.
   */
  findOffer(tenantId: string, professionalId: string, serviceIds: readonly string[]): Promise<OfferFacts | null>;
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
