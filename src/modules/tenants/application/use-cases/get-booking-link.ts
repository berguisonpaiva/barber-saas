import "server-only";
import { prisma } from "@/shared/database/prisma";

export interface BookingLink {
  shopName: string;
  url: string;
}

/** Link de agendamento da barbearia da sessão, para o proprietário divulgar. tenantId vem de requireOwner(). */
export async function getBookingLink(
  tenantId: string,
  appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
): Promise<BookingLink> {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { name: true, slug: true } });
  return { shopName: tenant.name, url: new URL(`/${tenant.slug}`, appUrl).toString() };
}
