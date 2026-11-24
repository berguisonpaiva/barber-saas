import "server-only";
import { prisma } from "@/shared/database/prisma";

const PAGE_SIZE = 100;

function searchFilter(query: string) {
  const term = query.trim().slice(0, 60);
  if (!term) return {};
  const digits = term.replace(/\D/g, "");
  return {
    OR: [
      { name: { contains: term, mode: "insensitive" as const } },
      ...(digits.length >= 3 ? [{ phone: { contains: digits } }] : []),
    ],
  };
}

/** RF-16: clientes da barbearia, com busca por nome ou WhatsApp e a data da última visita (já ocorrida, não cancelada). */
export async function listCustomers(tenantId: string, query = "", now = new Date()) {
  const [tenant, customers] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { timezone: true } }),
    prisma.customer.findMany({
      where: { tenantId, ...searchFilter(query) },
      orderBy: { updatedAt: "desc" },
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        phone: true,
        _count: { select: { appointments: true } },
        appointments: {
          where: { startsAt: { lte: now }, status: { not: "CANCELED" } },
          orderBy: { startsAt: "desc" },
          take: 1,
          select: { startsAt: true },
        },
      },
    }),
  ]);
  return {
    timeZone: tenant.timezone,
    customers: customers.map(({ _count, appointments, ...customer }) => ({
      ...customer,
      appointmentCount: _count.appointments,
      lastVisitAt: appointments[0]?.startsAt ?? null,
    })),
  };
}
