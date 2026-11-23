"use client";

import { useRef, useState } from "react";
import { ImageUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_COVER_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";

type UploadState = { status: "idle" | "sending" | "done" } | { status: "error"; message: string };

/** Prévia da capa e troca da foto (tela "Dados da barbearia"). */
export function CoverUploader({ shopName, initialCoverUrl }: { shopName: string; initialCoverUrl: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl);
  const [state, setState] = useState<UploadState>({ status: "idle" });

  async function upload(file: File) {
    if (file.size > MAX_COVER_BYTES) return setState({ status: "error", message: "A foto pode ter até 5 MB." });

    setState({ status: "sending" });
    const body = new FormData();
    body.set("cover", file);
    const response = await fetch("/api/painel/barbearia/capa", { method: "POST", body }).catch(() => null);
    const payload = await response?.json().catch(() => null);

    if (!response?.ok) {
      return setState({ status: "error", message: payload?.error?.message ?? "Não foi possível enviar a foto. Tente de novo." });
    }
    setCoverUrl(payload.coverUrl);
    setState({ status: "done" });
  }

  const sending = state.status === "sending";

  return (
    <section className="flex flex-col gap-4">
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-oxblood/60 to-canvas">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- capa vem do storage S3 público, sem otimizador de imagem configurado
          <img src={coverUrl} alt={`Capa da ${shopName}`} className="size-full object-cover" />
        ) : (
          <p className="absolute inset-0 grid place-items-center text-body-md text-fg-muted">Sem foto de capa</p>
        )}
      </div>

      <input
        ref={input}
        type="file"
        accept={ACCEPTED_TYPES}
        className="sr-only"
        aria-label="Foto de capa"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void upload(file);
        }}
      />
      <Button variant="secondary" size="md" onClick={() => input.current?.click()} disabled={sending}>
        <ImageUp aria-hidden />
        {sending ? "Enviando…" : coverUrl ? "Trocar foto" : "Escolher foto"}
      </Button>

      <p className="text-body-sm text-fg-muted">JPEG, PNG ou WebP, até 5 MB. Ela aparece no topo do seu link de agendamento.</p>
      <p aria-live="polite" className={state.status === "error" ? "text-body-sm text-danger" : "text-body-sm text-success"}>
        {state.status === "error" ? state.message : null}
        {state.status === "done" ? "Capa atualizada." : null}
      </p>
    </section>
  );
}
