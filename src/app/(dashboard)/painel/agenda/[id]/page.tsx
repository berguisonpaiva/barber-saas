import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { CalendarClock, Clock, MessageCircle, Phone, Scissors, UserRound, Wallet } from "lucide-react";
import { AppointmentActions } from "@/components/painel/appointment-actions";
import { APPOINTMENT_STATUS_UI } from "@/components/painel/appointment-status";
import { PageHeader } from "@/components/painel/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireOwner } from "@/modules/identity/application/require-owner";
import { getAppointmentDetail } from "@/modules/appointments/application/use-cases/get-appointment-detail";
import { AppointmentNotFoundError } from "@/modules/appointments/domain/errors";
import {
  cancelByOwnerAction,
  recordAttendanceAction,
} from "@/modules/appointments/presentation/actions/owner-appointment-actions";
import { parseEntityId } from "@/shared/forms/entity-id";
import { NotFoundError } from "@/shared/errors/app-error";
import { LocalDay } from "@/shared/time/local-day";
import { clockTime, dayMonth, WEEKDAY_LONG } from "@/shared/time/format";
import { formatBRL } from "@/shared/utils/money";
import { formatBrazilPhone } from "@/shared/utils/phone";

export const metadata: Metadata = { title: "Agendamento" };

/** Tela P2: detalhe do agendamento, contato com o cliente e Atendido/Faltou/Cancelar (RN-06). */
export default function AgendamentoPage({ params }: PageProps<"/painel/agenda/[id]">) {
  return (
    <main className="flex flex-col gap-6 px-6 pt-6">
      <Suspense fallback={<div className="h-[640px] animate-pulse rounded-xl bg-surface" />}>
        <AppointmentDetail params={params} />
      </Suspense>
    </main>
  );
}

async function loadAppointment(tenantId: string, id: string) {
  try {
    return await getAppointmentDetail(tenantId, parseEntityId(id, "Agendamento não encontrado."));
  } catch (error) {
    if (error instanceof AppointmentNotFoundError || error instanceof NotFoundError) notFound();
    throw error;
  }
}

function DetailRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-fg-muted [&_svg]:size-5">{icon}</span>
      <span className="flex min-w-0 flex-col">
        <span className="text-body-sm text-fg-muted">{label}</span>
        <span className="text-title-sm">{children}</span>
      </span>
    </div>
  );
}

async function AppointmentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenantId } = await requireOwner();
  const appointment = await loadAppointment(tenantId, id);
  const { timeZone } = appointment;
  const status = APPOINTMENT_STATUS_UI[appointment.status];
  const day = LocalDay.of(appointment.startsAt, timeZone);
  const whatsappDigits = appointment.customer.phone.replace(/\D/g, "");

  return (
    <>
      <PageHeader
        title={appointment.customerNameSnapshot}
        overline="Agendamento"
        back={{ href: `/painel/agenda?data=${day.toString()}` as Route, label: "Agenda" }}
        action={<Badge tone={status.tone}>{status.label}</Badge>}
      />

      <div className="grid grid-cols-2 gap-3">
        <a
          href={`https://wa.me/${whatsappDigits}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "secondary", size: "md" })}
        >
          <MessageCircle aria-hidden />
          WhatsApp
        </a>
        <a href={`tel:${appointment.customer.phone}`} className={buttonVariants({ variant: "secondary", size: "md" })}>
          <Phone aria-hidden />
          Ligar
        </a>
      </div>

      <section className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface px-4">
        <DetailRow icon={<CalendarClock aria-hidden />} label="Quando">
          {WEEKDAY_LONG[day.weekday]}, {dayMonth(appointment.startsAt, timeZone)} · {clockTime(appointment.startsAt, timeZone)}–
          {clockTime(appointment.endsAt, timeZone)}
        </DetailRow>
        <DetailRow icon={<Scissors aria-hidden />} label="Serviço">
          {appointment.serviceNameSnapshot}
        </DetailRow>
        <DetailRow icon={<UserRound aria-hidden />} label="Profissional">
          {appointment.professional.name}
        </DetailRow>
        <DetailRow icon={<Wallet aria-hidden />} label="Valor">
          {formatBRL(appointment.priceSnapshotCents)}
        </DetailRow>
        <DetailRow icon={<Clock aria-hidden />} label="Duração">
          {appointment.durationSnapshotMinute} min
        </DetailRow>
      </section>

      <p className="text-body-sm text-fg-muted">
        WhatsApp {formatBrazilPhone(appointment.customer.phone)} ·{" "}
        {appointment.source === "PUBLIC_LINK" ? "marcado pelo link" : "marcado pelo painel"} em{" "}
        {dayMonth(appointment.createdAt, timeZone)}.{" "}
        <Link href={`/painel/mais/clientes/${appointment.customer.id}` as Route} className="text-fg-accent underline">
          Ver histórico do cliente
        </Link>
      </p>

      {appointment.status === "CANCELED" && appointment.canceledAt ? (
        <p className="text-body-sm text-fg-muted">
          Cancelado {appointment.canceledBy === "OWNER" ? "pela barbearia" : "pelo cliente"} em{" "}
          {dayMonth(appointment.canceledAt, timeZone)} às {clockTime(appointment.canceledAt, timeZone)}.
        </p>
      ) : null}

      <AppointmentActions
        status={appointment.status}
        canRecordAttendance={appointment.actions.canRecordAttendance}
        canCancel={appointment.actions.canCancel}
        recordAttendance={recordAttendanceAction.bind(null, appointment.id)}
        cancel={cancelByOwnerAction.bind(null, appointment.id)}
      />
    </>
  );
}
