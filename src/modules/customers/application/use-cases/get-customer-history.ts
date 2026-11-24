import "server-only";
import { prisma } from "@/shared/database/prisma";
import { NotFoundError } from "@/shared/errors/app-error";

const HISTORY_SIZE = 50;

/** RF-16: dados do cliente, totais por situação e os últimos agendamentos (snapshots de nome/preço). */
export async function getCustomerHistory(tenantId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: { tenantId, id: customerId },
    select: {
      id: true,
      name: true,
      phone: true,
      createdAt: true,
      tenant: { select: { timezone: true } },
      appointments: {
        orderBy: { startsAt: "desc" },
        take: HISTORY_SIZE,
        select: {
          id: true,
          startsAt: true,
          status: true,
          serviceNameSnapshot: true,
          priceSnapshotCents: true,
          professional: { select: { name: true } },
        },
      },
    },
  });
  if (!customer) throw new NotFoundError("Cliente não encontrado.");

  const totals = await prisma.appointment.groupBy({
    by: ["status"],
    where: { tenantId, customerId },
    _count: { _all: true },
    _sum: { priceSnapshotCents: true },
  });
  const byStatus = Object.fromEntries(totals.map((row) => [row.status, row._count._all]));
  const completedCents = totals.find((row) => row.status === "COMPLETED")?._sum.priceSnapshotCents ?? 0;

  const { tenant, ...rest } = customer;
  return {
    ...rest,
    timeZone: tenant.timezone,
    stats: {
      total: totals.reduce((sum, row) => sum + row._count._all, 0),
      completed: byStatus.COMPLETED ?? 0,
      noShow: byStatus.NO_SHOW ?? 0,
      canceled: byStatus.CANCELED ?? 0,
      completedCents,
    },
  };
}
