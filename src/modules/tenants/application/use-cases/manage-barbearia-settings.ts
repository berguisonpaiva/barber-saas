import "server-only";
import { prisma } from "@/shared/database/prisma";
import { NotFoundError } from "@/shared/errors/app-error";
import type { BarbeariaSettingsInput } from "../../presentation/schemas/barbearia-settings";

const settingsSelect = {
  name: true,
  slug: true,
  address: true,
  phone: true,
  timezone: true,
  slotIntervalMinutes: true,
  minAdvanceMinutes: true,
  maxAdvanceDays: true,
  cancellationWindowMinutes: true,
} as const;

export async function getBarbeariaSettings(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: settingsSelect });
  if (!tenant) throw new NotFoundError("Barbearia não encontrada.");
  return tenant;
}

/** RF-02: o slug (Link de agendamento) fica de fora de propósito — nunca muda depois de divulgado. */
export async function updateBarbeariaSettings(tenantId: string, input: BarbeariaSettingsInput) {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      name: input.name,
      address: input.address ?? null,
      phone: input.phone,
      timezone: input.timezone,
      slotIntervalMinutes: input.slotIntervalMinutes,
      minAdvanceMinutes: input.minAdvanceMinutes,
      maxAdvanceDays: input.maxAdvanceDays,
      cancellationWindowMinutes: input.cancellationWindowMinutes,
    },
  });
}
