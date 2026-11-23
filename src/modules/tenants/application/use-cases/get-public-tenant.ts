import "server-only";
import { prisma } from "@/shared/database/prisma";
import { NotFoundError } from "@/shared/errors/app-error";
import { isBookingEnabled } from "@/modules/billing/domain/booking-gate";
import type { CoverStorage } from "../ports/cover-storage";
import { envCoverUrls } from "../../infrastructure/s3-cover-storage";

export interface PublicTenant {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  address: string | null;
  coverUrl: string | null;
  bookingEnabled: boolean;
}

/** Página pública: o tenant é resolvido pelo slug (RN-01) e nunca vem do navegador como id. */
export async function getPublicTenant(
  slug: string,
  covers: Pick<CoverStorage, "publicUrl"> = envCoverUrls,
  now = new Date(),
): Promise<PublicTenant> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      timezone: true,
      address: true,
      coverImageKey: true,
      status: true,
      subscription: { select: { status: true, currentPeriodEnd: true } },
    },
  });
  if (!tenant || tenant.status === "SUSPENDED") throw new NotFoundError("Barbearia não encontrada.");

  const { subscription, status, coverImageKey, ...rest } = tenant;
  void status;
  return {
    ...rest,
    coverUrl: coverImageKey ? covers.publicUrl(coverImageKey) : null,
    bookingEnabled: isBookingEnabled(subscription, now),
  };
}
