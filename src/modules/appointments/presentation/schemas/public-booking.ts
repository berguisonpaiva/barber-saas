import { z } from "zod";
import { MAX_SERVICES_PER_APPOINTMENT } from "@/modules/scheduling/domain/service-selection";

const serviceIdList = z
  .array(z.uuid())
  .min(1, "Escolha ao menos um serviço.")
  .max(MAX_SERVICES_PER_APPOINTMENT, `Escolha até ${MAX_SERVICES_PER_APPOINTMENT} serviços por agendamento.`);

/** Na URL os serviços vão separados por vírgula: ?serviceIds=a,b */
export const serviceIdsParam = z
  .string()
  .transform((value) => value.split(",").filter(Boolean))
  .pipe(serviceIdList);

export const availabilityQuerySchema = z.object({
  serviceIds: serviceIdsParam,
  professionalId: z.uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use AAAA-MM-DD."),
});

export const createPublicAppointmentSchema = z.object({
  serviceIds: serviceIdList,
  professionalId: z.uuid(),
  startsAt: z.iso.datetime({ offset: true }).transform((v) => new Date(v)),
  customer: z.object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(8).max(25),
  }),
  consent: z.literal(true, { error: "É preciso aceitar o uso dos dados (LGPD)." }),
  /** Honeypot anti-bot: precisa vir vazio (RN-10). */
  website: z.string().max(0).optional(),
});

export const cancelByTokenSchema = z.object({
  token: z.string().min(20).max(100),
});
