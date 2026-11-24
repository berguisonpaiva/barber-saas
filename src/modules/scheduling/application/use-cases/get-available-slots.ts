import { NotFoundError } from "@/shared/errors/app-error";
import type { Clock } from "@/shared/utils/clock";
import { LocalDay } from "@/shared/time/local-day";
import { computeAvailableSlots } from "../../domain/availability";
import { isBookable, scheduleOf } from "../../domain/day-facts";
import { combineServices, parseServiceSelection, type ServiceCombination } from "../../domain/service-selection";
import type { SchedulingRepository } from "../ports/scheduling-repository";

export interface GetAvailableSlotsInput {
  tenantId: string;
  professionalId: string;
  serviceIds: readonly string[];
  date: string; // YYYY-MM-DD no fuso da barbearia
}

export interface GetAvailableSlotsOutput {
  date: string;
  timeZone: string;
  combination: ServiceCombination;
  professionalName: string;
  slots: Date[];
}

export class GetAvailableSlots {
  constructor(
    private readonly repo: SchedulingRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: GetAvailableSlotsInput): Promise<GetAvailableSlotsOutput> {
    const settings = await this.repo.getSettings(input.tenantId);
    if (!settings) throw new NotFoundError("Barbearia não encontrada.");
    const day = LocalDay.parse(input.date, settings.timeZone);

    const serviceIds = parseServiceSelection(input.serviceIds);
    const offer = await this.repo.findOffer(input.tenantId, input.professionalId, serviceIds);
    if (!offer || !isBookable(offer)) throw new NotFoundError("Serviço indisponível para este profissional.");
    const combination = combineServices(
      offer.services.map(({ id, name, priceCents, durationMinutes }) => ({ id, name, priceCents, durationMinutes })),
    );

    const { start: dayStartUtc, end: dayEndUtc } = day.utcRange();
    const facts = await this.repo.getDayFacts({
      tenantId: input.tenantId,
      professionalId: input.professionalId,
      date: day.toString(),
      weekday: day.weekday,
      dayStartUtc,
      dayEndUtc,
    });

    const slots = computeAvailableSlots({
      day,
      ...scheduleOf(facts),
      durationMinutes: combination.durationMinutes,
      slotIntervalMinutes: settings.slotIntervalMinutes,
      now: this.clock.now(),
      minAdvanceMinutes: settings.minAdvanceMinutes,
      maxAdvanceDays: settings.maxAdvanceDays,
    });

    return {
      date: day.toString(),
      timeZone: settings.timeZone,
      combination,
      professionalName: offer.professional.name,
      slots,
    };
  }
}
