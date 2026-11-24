/** Um período do expediente semanal, em minutos desde 00:00 no fuso da barbearia. */
export interface WorkingPeriod {
  weekday: number;
  startMinute: number;
  endMinute: number;
}

export interface ScheduleIssue {
  weekday: number;
  message: string;
}

export type ScheduleValidation = { ok: true; periods: WorkingPeriod[] } | { ok: false; issues: ScheduleIssue[] };

const MINUTES_PER_DAY = 24 * 60;
const byStart = (a: WorkingPeriod, b: WorkingPeriod) => a.weekday - b.weekday || a.startMinute - b.startMinute;

function periodIssue(period: WorkingPeriod): string | null {
  if (!Number.isInteger(period.weekday) || period.weekday < 0 || period.weekday > 6) return "Dia da semana inválido.";
  if (period.startMinute < 0 || period.endMinute > MINUTES_PER_DAY) return "Horário fora do dia.";
  if (period.endMinute <= period.startMinute) return "O fim precisa ser depois do início.";
  return null;
}

/**
 * Expediente: cada período começa antes de terminar e não se sobrepõe a outro do mesmo dia.
 * Intervalos (ex.: almoço) são o espaço entre dois períodos; períodos encostados (12:00–12:00) são válidos.
 */
export function validateWeeklySchedule(periods: WorkingPeriod[]): ScheduleValidation {
  const sorted = [...periods].sort(byStart);
  const issues: ScheduleIssue[] = [];

  sorted.forEach((period, index) => {
    const problem = periodIssue(period);
    if (problem) return issues.push({ weekday: period.weekday, message: problem });

    const previous = sorted[index - 1];
    if (previous?.weekday === period.weekday && period.startMinute < previous.endMinute) {
      issues.push({ weekday: period.weekday, message: "Há períodos sobrepostos neste dia." });
    }
  });

  return issues.length ? { ok: false, issues } : { ok: true, periods: sorted };
}

/** Total de minutos de atendimento na semana (resumo da tela de Equipe). */
export function weeklyWorkingMinutes(periods: WorkingPeriod[]): number {
  return periods.reduce((total, period) => total + (period.endMinute - period.startMinute), 0);
}
