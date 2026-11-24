import type { NextRequest } from "next/server";
import { findNextFreeSlot } from "@/composition-root";
import { getPublicTenant } from "@/modules/tenants/application/use-cases/get-public-tenant";
import { listPublicProfessionals } from "@/modules/professionals/application/use-cases/list-public-professionals";
import { serviceIdsParam } from "@/modules/appointments/presentation/schemas/public-booking";
import { toErrorResponse } from "@/shared/errors/http";

/** Com serviceIds, só quem executa todos os serviços, cada um com o próximo Horário livre (nextSlot, ISO UTC ou null). */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/public/[slug]/professionals">) {
  try {
    const { slug } = await ctx.params;
    const serviceIds = serviceIdsParam.optional().parse(req.nextUrl.searchParams.get("serviceIds") ?? undefined);
    const tenant = await getPublicTenant(slug);
    const professionals = await listPublicProfessionals(tenant.id, serviceIds);
    if (!serviceIds || !tenant.bookingEnabled) return Response.json({ professionals });

    const withNextSlot = await Promise.all(
      professionals.map(async (professional) => {
        const next = await findNextFreeSlot.execute({ tenantId: tenant.id, professionalId: professional.id, serviceIds });
        return { ...professional, nextSlot: next?.toISOString() ?? null };
      }),
    );
    return Response.json({ professionals: withNextSlot });
  } catch (error) {
    return toErrorResponse(error);
  }
}
