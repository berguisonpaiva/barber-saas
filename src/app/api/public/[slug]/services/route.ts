import type { NextRequest } from "next/server";
import { getPublicTenant } from "@/modules/tenants/application/use-cases/get-public-tenant";
import { listPublicServices } from "@/modules/catalog/application/use-cases/list-public-services";
import { toErrorResponse } from "@/shared/errors/http";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/public/[slug]/services">) {
  try {
    const { slug } = await ctx.params;
    const tenant = await getPublicTenant(slug);
    const services = await listPublicServices(tenant.id);
    return Response.json({ tenant: { name: tenant.name, bookingEnabled: tenant.bookingEnabled }, services });
  } catch (error) {
    return toErrorResponse(error);
  }
}
