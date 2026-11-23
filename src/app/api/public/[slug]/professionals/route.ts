import type { NextRequest } from "next/server";
import { z } from "zod";
import { getPublicTenant } from "@/modules/tenants/application/use-cases/get-public-tenant";
import { listPublicProfessionals } from "@/modules/professionals/application/use-cases/list-public-professionals";
import { toErrorResponse } from "@/shared/errors/http";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/public/[slug]/professionals">) {
  try {
    const { slug } = await ctx.params;
    const serviceId = z.uuid().optional().parse(req.nextUrl.searchParams.get("serviceId") ?? undefined);
    const tenant = await getPublicTenant(slug);
    return Response.json({ professionals: await listPublicProfessionals(tenant.id, serviceId) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
