import { NotFoundError } from "@/shared/errors/app-error";
import { LocalDay } from "@/shared/time/local-day";
import type { Clock } from "@/shared/utils/clock";
import type { SchedulingRepository } from "../ports/scheduling-repository";
import type { GetAvailableSlots } from "./get-available-slots";

/** Primeiro Horário livre do profissional para o serviço, de hoje até o Limite de dias (null se não houver). */
export class FindNextFreeSlot {
  constructor(
    private readonly slots: GetAvailableSlots,
    private readonly repo: SchedulingRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: { tenantId: string; professionalId: string; serviceId: string }): Promise<Date | null> {
    const settings = await this.repo.getSettings(input.tenantId);
    if (!settings) throw new NotFoundError("Barbearia não encontrada.");

    const today = LocalDay.today(this.clock, settings.timeZone);
    for (let offset = 0; offset <= settings.maxAdvanceDays; offset++) {
      const { slots } = await this.slots.execute({ ...input, date: today.addDays(offset).toString() });
      if (slots.length) return slots[0];
    }
    return null;
  }
}
