import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/shared/utils/cn";

/** Componente "Button" do Figma: pílula, variantes Primary/Secondary/Outline/Ghost/Danger. */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5",
  {
    variants: {
      variant: {
        primary: "bg-accent text-on-accent hover:bg-accent-pressed",
        secondary: "bg-muted text-fg hover:bg-raised",
        outline: "border border-line-strong text-fg hover:bg-muted",
        ghost: "text-fg-accent hover:bg-accent-subtle",
        danger: "bg-danger-subtle text-danger hover:opacity-90",
      },
      size: {
        lg: "h-14 px-6 text-label-lg",
        md: "h-11 px-4 text-label-md",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "lg" },
  },
);

export type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, block, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, block }), className)} {...props} />;
}
