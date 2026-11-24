import "server-only";
import { sendNotification, setVapidDetails } from "web-push";
import type { PushMessage } from "../domain/messages";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new Error("Chaves VAPID não configuradas.");
  setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:contato@barbersaas.app", publicKey, privateKey);
  configured = true;
}

export type SendResult = "sent" | "gone" | "failed";

/** Envia um push. "gone" = inscrição expirada/inválida (404/410) e deve ser desativada. */
export async function sendPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  message: PushMessage,
): Promise<SendResult> {
  ensureConfigured();
  try {
    await sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(message),
      { TTL: 60 * 60 },
    );
    return "sent";
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) return "gone";
    console.error("[push] falha ao enviar", status, error);
    return "failed";
  }
}
