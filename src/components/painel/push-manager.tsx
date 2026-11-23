"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

const noopSubscribe = () => () => {};
const pushSupported = () => "serviceWorker" in navigator && "PushManager" in window;

/** Tela O6: só pede permissão após clique explícito (PRD §11). */
export function PushManager() {
  const supported = useSyncExternalStore(noopSubscribe, pushSupported, () => false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub));
  }, [supported]);

  async function subscribe() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setSubscribed(true);
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <p className="text-body-md text-fg-muted">
        No iPhone, toque em Compartilhar → Adicionar à Tela de Início e abra o app por lá para ativar as notificações.
      </p>
    );
  }
  if (subscribed) return <p className="text-body-md text-success">Notificações ativadas neste aparelho.</p>;
  return (
    <Button onClick={subscribe} disabled={busy} block>
      {busy ? "Ativando…" : "Ativar notificações"}
    </Button>
  );
}
