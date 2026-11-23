import { NotFoundError } from "@/shared/errors/app-error";
import type { Clock } from "@/shared/utils/clock";
import { LocalDay } from "@/shared/time/local-day";
import { computeAvailableSlots } from "../../domain/availability";
import { isBookable, scheduleOf } from "../../domain/day-facts";
import type { SchedulingRepository, SchedulingService } from "../ports/scheduling-repository";

export interface GetAvailableSlotsInput {
  tenantId: string;
  professionalId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD no fuso da barbearia
}

export interface GetAvailableSlotsOutput {
  date: string;
  timeZone: string;
  service: SchedulingService;
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

    const offer = await this.repo.findOffer(input.tenantId, input.professionalId, input.serviceId);
    if (!offer || !isBookable(offer)) throw new NotFoundError("Serviço indisponível para este profissional.");
    const { id, name, priceCents, durationMinutes } = offer.service;
    const service: SchedulingService = { id, name, priceCents, durationMinutes };

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
      durationMinutes: service.durationMinutes,
      slotIntervalMinutes: settings.slotIntervalMinutes,
      now: this.clock.now(),
      minAdvanceMinutes: settings.minAdvanceMinutes,
      maxAdvanceDays: settings.maxAdvanceDays,
    });

    return {
      date: day.toString(),
      timeZone: settings.timeZone,
      service,
      professionalName: offer.professional.name,
      slots,
    };
  }
}
