import "server-only";
import { prisma } from "@/shared/database/prisma";
import { isUniqueViolation } from "@/shared/database/errors";
import { ConflictError, NotFoundError } from "@/shared/errors/app-error";
import type { CustomerInput } from "../../presentation/schemas/customer";

/**
 * Corrige nome/WhatsApp do cliente. O WhatsApp identifica o cliente na barbearia (único por tenant);
 * os agendamentos antigos mantêm o nome informado em cada marcação (snapshot).
 */
export async function updateCustomer(tenantId: string, customerId: string, input: CustomerInput) {
  try {
    const { count } = await prisma.customer.updateMany({
      where: { tenantId, id: customerId },
      data: { name: input.name, phone: input.phone },
    });
    if (!count) throw new NotFoundError("Cliente não encontrado.");
  } catch (error) {
    if (isUniqueViolation(error)) throw new ConflictError("Já existe um cliente com este WhatsApp.", "PHONE_TAKEN");
    throw error;
  }
}
