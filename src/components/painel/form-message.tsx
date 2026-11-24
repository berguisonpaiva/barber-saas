import { Note } from "@/components/ui/note";
import type { FormState } from "@/shared/forms/form-state";

/** Mensagem geral de um formulário (erro ou sucesso), anunciada por leitores de tela. */
export function FormMessage({ state }: { state: FormState }) {
  return (
    <div aria-live="polite">
      {state?.error ? <Note tone="danger">{state.error}</Note> : null}
      {state?.success ? <Note tone="success">{state.success}</Note> : null}
    </div>
  );
}
