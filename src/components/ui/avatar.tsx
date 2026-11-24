import { cn } from "@/shared/utils/cn";

const sizes = { sm: "size-8 text-label-md", md: "size-12 text-title-sm", lg: "size-16 text-title-md" } as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** Componente "Avatar" do Figma: iniciais sobre fundo cobre. */
export function Avatar({ name, size = "md", muted }: { name: string; size?: keyof typeof sizes; muted?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold",
        muted ? "bg-muted text-fg-muted" : "bg-copper/25 text-copper",
        sizes[size],
      )}
    >
      {initials(name)}
    </span>
  );
}
