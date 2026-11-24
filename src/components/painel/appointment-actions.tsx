"use client";

import { useState, useTransition } from "react";
import { Check, UserX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/painel/form-message";
import type { FormState } from "@/shared/forms/form-state";

type AppointmentActionsProps = {
  status: "CONFIRMED" | "COMPLETED" | "CANCELED" | "NO_SHOW";
  canRecordAttendance: boolean;
  canCancel: boolean;
  recordAttendance: (outcome: "COMPLETED" | "NO_SHOW") => Promise<FormState>;
  cancel: () => Promise<FormState>;
};

/** Ações da tela P2: Atendido, Faltou e Cancelar (este em dois toques). */
export function AppointmentActions({ status, canRecordAttendance, canCancel, recordAttendance, cancel }: AppointmentActionsProps) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<FormState>();
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const run = (action: () => Promise<FormState>) =>
    startTransition(async () => {
      setState(await action());
      setConfirmingCancel(false);
    });

  if (!canRecordAttendance && !canCancel) return <FormMessage state={state} />;

  return (
    <section aria-label="Ações do agendamento" className="flex flex-col gap-3">
      {canRecordAttendance ? (
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="md"
            variant={status === "COMPLETED" ? "secondary" : "primary"}
            disabled={pending || status === "COMPLETED"}
            onClick={() => run(() => recordAttendance("COMPLETED"))}
          >
            <Check aria-hidden />
            Atendido
          </Button>
          <Button
            size="md"
            variant="secondary"
            disabled={pending || status === "NO_SHOW"}
            onClick={() => run(() => recordAttendance("NO_SHOW"))}
          >
            <UserX aria-hidden />
            Faltou
          </Button>
        </div>
      ) : (
        <p className="text-body-sm text-fg-muted">Atendido e Faltou ficam disponíveis a partir do horário marcado.</p>
      )}
      {canCancel ? (
        <Button
          size="md"
          variant="danger"
          block
          disabled={pending}
          onBlur={() => setConfirmingCancel(false)}
          onClick={() => (confirmingCancel ? run(cancel) : setConfirmingCancel(true))}
        >
          <X aria-hidden />
          {confirmingCancel ? "Toque de novo para cancelar" : "Cancelar agendamento"}
        </Button>
      ) : null}
      <FormMessage state={state} />
    </section>
  );
}
