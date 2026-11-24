import "server-only";
import { systemClock } from "@/shared/utils/clock";
import { PrismaSchedulingRepository } from "@/modules/scheduling/infrastructure/prisma/prisma-scheduling-repository";
import { GetAvailableSlots } from "@/modules/scheduling/application/use-cases/get-available-slots";
import { FindNextFreeSlot } from "@/modules/scheduling/application/use-cases/find-next-free-slot";
import { PrismaAppointmentRepository } from "@/modules/appointments/infrastructure/prisma/prisma-appointment-repository";
import { CreateAppointment } from "@/modules/appointments/application/use-cases/create-appointment";
import { CancelAppointmentByToken } from "@/modules/appointments/application/use-cases/cancel-appointment-by-token";
import { ViewAppointmentByCancelLink } from "@/modules/appointments/application/use-cases/view-appointment-by-cancel-link";
import { RecordAttendance } from "@/modules/appointments/application/use-cases/record-attendance";
import { CancelAppointmentByOwner } from "@/modules/appointments/application/use-cases/cancel-appointment-by-owner";

/**
 * Composição das dependências (casos de uso ← interfaces ← implementações Prisma).
 * Route Handlers e Server Actions pegam os casos de uso daqui.
 */
const schedulingRepo = new PrismaSchedulingRepository();
const appointmentRepo = new PrismaAppointmentRepository();

export const getAvailableSlots = new GetAvailableSlots(schedulingRepo, systemClock);
export const findNextFreeSlot = new FindNextFreeSlot(getAvailableSlots, schedulingRepo, systemClock);
export const createAppointment = new CreateAppointment(schedulingRepo, getAvailableSlots, appointmentRepo);
export const cancelAppointmentByToken = new CancelAppointmentByToken(appointmentRepo, systemClock);
export const viewAppointmentByCancelLink = new ViewAppointmentByCancelLink(appointmentRepo, systemClock);
export const recordAttendance = new RecordAttendance(appointmentRepo, systemClock);
export const cancelAppointmentByOwner = new CancelAppointmentByOwner(appointmentRepo, systemClock);
