import type { NextRequest } from "next/server";
import { createAppointment } from "@/composition-root";
import { getPublicTenant } from "@/modules/tenants/application/use-cases/get-public-tenant";
import { createPublicAppointmentSchema } from "@/modules/appointments/presentation/schemas/public-booking";
import { BookingDisabledError } from "@/modules/appointments/domain/errors";
import { assertRateLimit, clientIp } from "@/shared/security/rate-limit";
import { toErrorResponse } from "@/shared/errors/http";

/** RF-10: criação de agendamento pelo link público. */
export async function POST(req: NextRequest, ctx: RouteContext<"/api/public/[slug]/appointments">) {
  try {
    const { slug } = await ctx.params;
    const ip = clientIp(req.headers);
    await assertRateLimit(`booking:${slug}:${ip}`, 5, 10 * 60);

    const body = createPublicAppointmentSchema.parse(await req.json());
    const tenant = await getPublicTenant(slug);
    if (!tenant.bookingEnabled) throw new BookingDisabledError();

    const result = await createAppointment.execute({
      tenantId: tenant.id,
      professionalId: body.professionalId,
      serviceIds: body.serviceIds,
      startsAt: body.startsAt,
      customer: body.customer,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
    return Response.json(
      {
        appointmentId: result.appointmentId,
        startsAt: result.startsAt.toISOString(),
        endsAt: result.endsAt.toISOString(),
        cancelUrl: `${appUrl}/${slug}/cancelar?token=${encodeURIComponent(result.cancelToken)}`,
      },
      { status: 201 },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
