import type { NextRequest } from "next/server";
import { getAvailableSlots } from "@/composition-root";
import { getPublicTenant } from "@/modules/tenants/application/use-cases/get-public-tenant";
import { availabilityQuerySchema } from "@/modules/appointments/presentation/schemas/public-booking";
import { assertRateLimit, clientIp } from "@/shared/security/rate-limit";
import { toErrorResponse } from "@/shared/errors/http";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/public/[slug]/availability">) {
  try {
    const { slug } = await ctx.params;
    await assertRateLimit(`availability:${slug}:${clientIp(req.headers)}`, 120, 60);
    const query = availabilityQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const tenant = await getPublicTenant(slug);

    const result = await getAvailableSlots.execute({ tenantId: tenant.id, ...query });
    return Response.json({
      date: result.date,
      timeZone: result.timeZone,
      bookingEnabled: tenant.bookingEnabled,
      slots: tenant.bookingEnabled ? result.slots.map((s) => s.toISOString()) : [],
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
