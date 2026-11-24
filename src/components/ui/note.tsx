import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/shared/utils/cn";

const noteVariants = cva("rounded-md px-4 py-3 text-body-sm", {
  variants: {
    tone: {
      info: "bg-muted text-fg-muted",
      success: "bg-success-subtle text-success",
      danger: "bg-danger-subtle text-danger",
    },
  },
  defaultVariants: { tone: "info" },
});

/** Componente "Note" do Figma. */
export function Note({ className, tone, ...props }: ComponentProps<"p"> & VariantProps<typeof noteVariants>) {
  return <p className={cn(noteVariants({ tone }), className)} {...props} />;
}
