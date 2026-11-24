"use client";

import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

type ConfirmSubmitProps = Omit<ButtonProps, "type" | "onClick"> & { confirmLabel: string };

/** Botão de envio em dois toques: o primeiro pede confirmação, o segundo envia o formulário. */
export function ConfirmSubmit({ children, confirmLabel, ...props }: ConfirmSubmitProps) {
  const [armed, setArmed] = useState(false);
  if (armed) {
    return (
      <Button key="confirm" type="submit" {...props} onBlur={() => setArmed(false)} autoFocus>
        {confirmLabel}
      </Button>
    );
  }
  return (
    <Button key="ask" type="button" {...props} onClick={() => setArmed(true)}>
      {children}
    </Button>
  );
}
