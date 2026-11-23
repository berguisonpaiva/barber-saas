import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/shared/utils/cn";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold leading-[14px]", {
  variants: {
    tone: {
      accent: "bg-accent-subtle text-fg-accent",
      success: "bg-success-subtle text-success",
      danger: "bg-danger-subtle text-danger",
      neutral: "bg-muted text-fg-muted",
    },
  },
  defaultVariants: { tone: "accent" },
});

export function Badge({ className, tone, children, ...props }: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
