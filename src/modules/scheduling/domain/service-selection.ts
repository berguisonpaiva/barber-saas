import { ValidationError } from "@/shared/errors/app-error";

export const MAX_SERVICES_PER_APPOINTMENT = 5;

export interface SelectedService {
  id: string;
  name: string;
  priceCents: number;
  durationMinutes: number;
}

/** Os serviços de um Agendamento vistos como um atendimento só: nome "Corte + Barba", preço e duração somados. */
export interface ServiceCombination {
  services: readonly SelectedService[];
  name: string;
  priceCents: number;
  durationMinutes: number;
}

/** Ids escolhidos pelo cliente, na ordem da escolha e sem repetição: de 1 a MAX_SERVICES_PER_APPOINTMENT. */
export function parseServiceSelection(serviceIds: readonly string[]): string[] {
  const unique = [...new Set(serviceIds)];
  if (!unique.length) throw new ValidationError("Escolha ao menos um serviço.");
  if (unique.length > MAX_SERVICES_PER_APPOINTMENT) {
    throw new ValidationError(`Escolha até ${MAX_SERVICES_PER_APPOINTMENT} serviços por agendamento.`);
  }
  return unique;
}

export function combineServices(services: readonly SelectedService[]): ServiceCombination {
  return {
    services,
    name: services.map((service) => service.name).join(" + "),
    priceCents: services.reduce((total, service) => total + service.priceCents, 0),
    durationMinutes: services.reduce((total, service) => total + service.durationMinutes, 0),
  };
}
