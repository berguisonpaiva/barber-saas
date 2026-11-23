import type { NextRequest } from "next/server";
import { z } from "zod";
import { findNextFreeSlot } from "@/composition-root";
import { getPublicTenant } from "@/modules/tenants/application/use-cases/get-public-tenant";
import { listPublicProfessionals } from "@/modules/professionals/application/use-cases/list-public-professionals";
import { toErrorResponse } from "@/shared/errors/http";

/** Com serviceId, cada profissional vem com o próximo Horário livre (nextSlot, ISO UTC ou null). */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/public/[slug]/professionals">) {
  try {
    const { slug } = await ctx.params;
    const serviceId = z.uuid().optional().parse(req.nextUrl.searchParams.get("serviceId") ?? undefined);
    const tenant = await getPublicTenant(slug);
    const professionals = await listPublicProfessionals(tenant.id, serviceId);
    if (!serviceId || !tenant.bookingEnabled) return Response.json({ professionals });

    const withNextSlot = await Promise.all(
      professionals.map(async (professional) => {
        const next = await findNextFreeSlot.execute({ tenantId: tenant.id, professionalId: professional.id, serviceId });
        return { ...professional, nextSlot: next?.toISOString() ?? null };
      }),
    );
    return Response.json({ professionals: withNextSlot });
  } catch (error) {
    return toErrorResponse(error);
  }
}
