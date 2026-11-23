"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

type Feedback = "idle" | "copied" | "copy-failed";

const FEEDBACK_MS = 2000;

/** Cartão "Seu link de agendamento" (tela P8 · Mais): mostra, copia e compartilha o link. */
export function BookingLinkCard({ shopName, url }: { shopName: string; url: string }) {
  const [feedback, setFeedback] = useState<Feedback>("idle");

  useEffect(() => {
    if (feedback === "idle") return;
    const timer = setTimeout(() => setFeedback("idle"), FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [feedback]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setFeedback("copied");
    } catch {
      setFeedback("copy-failed");
    }
  }

  async function share() {
    if (!navigator.share) return copy();
    try {
      await navigator.share({ title: shopName, text: `Agende seu horário na ${shopName}`, url });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      await copy();
    }
  }

  const copied = feedback === "copied";

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-accent bg-surface p-4">
      <h2 className="text-overline text-fg-muted">Seu link de agendamento</h2>
      <p className="text-title-md break-all">{url.replace(/^https?:\/\//, "")}</p>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" size="md" onClick={copy}>
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
        <Button size="md" onClick={share}>
          Compartilhar
        </Button>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? "Link copiado." : null}
      </p>
      {feedback === "copy-failed" ? (
        <p role="alert" className="text-body-sm text-danger">
          Não foi possível copiar. Selecione o link acima.
        </p>
      ) : null}
    </section>
  );
}
