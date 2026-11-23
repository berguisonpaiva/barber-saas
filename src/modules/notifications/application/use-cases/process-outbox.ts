import "server-only";
import { prisma } from "@/shared/database/prisma";
import type { AppointmentEventPayload, OutboxEventType } from "../../domain/events";
import { buildPushMessage } from "../../domain/messages";
import { sendPush } from "../../infrastructure/web-push-sender";

const MAX_ATTEMPTS = 5;

type ClaimedEvent = { id: string; tenantId: string | null; type: string; payload: unknown; attempts: number };

/**
 * Processa eventos pendentes do outbox (chamado por cron).
 * FOR UPDATE SKIP LOCKED permite rodar mais de um processador sem duplicar envio.
 * Falha na notificação NUNCA afeta o agendamento (RN-07).
 */
export async function processOutbox(batchSize = 25) {
  const events = await prisma.$queryRaw<ClaimedEvent[]>`
    UPDATE "OutboxEvent" SET "status" = 'PROCESSING', "attempts" = "attempts" + 1
    WHERE "id" IN (
      SELECT "id" FROM "OutboxEvent"
      WHERE "status" = 'PENDING' AND "availableAt" <= now()
      ORDER BY "createdAt"
      LIMIT ${batchSize}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING "id", "tenantId", "type", "payload", "attempts"
  `;

  let done = 0;
  let retried = 0;

  for (const event of events) {
    try {
      await dispatch(event);
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { status: "DONE", processedAt: new Date(), lastError: null },
      });
      done++;
    } catch (error) {
      const failed = event.attempts >= MAX_ATTEMPTS;
      const backoffMinutes = 2 ** event.attempts;
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: failed ? "FAILED" : "PENDING",
          availableAt: new Date(Date.now() + backoffMinutes * 60_000),
          lastError: String(error).slice(0, 500),
        },
      });
      retried++;
    }
  }

  return { claimed: events.length, done, retried };
}

async function dispatch(event: ClaimedEvent) {
  if (!event.tenantId) return;
  if (event.type !== "appointment.confirmed" && event.type !== "appointment.canceled") return;

  const message = buildPushMessage(event.type as OutboxEventType, event.payload as AppointmentEventPayload);

  // Só inscrições do PROPRIETÁRIO deste tenant (RN-07).
  const subs = await prisma.pushSubscription.findMany({
    where: { tenantId: event.tenantId, enabled: true },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });

  for (const sub of subs) {
    const result = await sendPush(sub, message);
    if (result === "sent") {
      await prisma.pushSubscription.update({
        where: { id: sub.id },
        data: { lastSuccessAt: new Date(), failureCount: 0 },
      });
    } else if (result === "gone") {
      await prisma.pushSubscription.update({ where: { id: sub.id }, data: { enabled: false } });
    } else {
      await prisma.pushSubscription.update({ where: { id: sub.id }, data: { failureCount: { increment: 1 } } });
    }
  }
}
