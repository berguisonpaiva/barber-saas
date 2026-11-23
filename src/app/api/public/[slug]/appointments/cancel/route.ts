import type { NextRequest } from "next/server";
import { cancelAppointmentByToken } from "@/composition-root";
import { getPublicTenant } from "@/modules/tenants/application/use-cases/get-public-tenant";
import { cancelByTokenSchema } from "@/modules/appointments/presentation/schemas/public-booking";
import { assertRateLimit, clientIp } from "@/shared/security/rate-limit";
import { toErrorResponse } from "@/shared/errors/http";

/** RN-08: cancelamento pelo cliente com token. */
export async function POST(req: NextRequest, ctx: RouteContext<"/api/public/[slug]/appointments/cancel">) {
  try {
    const { slug } = await ctx.params;
    await assertRateLimit(`cancel:${slug}:${clientIp(req.headers)}`, 10, 10 * 60);
    const { token } = cancelByTokenSchema.parse(await req.json());
    const tenant = await getPublicTenant(slug);
    const result = await cancelAppointmentByToken.execute({ tenantId: tenant.id, token });
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
