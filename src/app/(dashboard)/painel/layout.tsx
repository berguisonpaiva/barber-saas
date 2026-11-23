import { BottomNav } from "@/components/painel/bottom-nav";

export default function PainelLayout({ children }: LayoutProps<"/painel">) {
  return (
    <div className="mx-auto min-h-dvh max-w-md pb-32">
      {children}
      <BottomNav />
    </div>
  );
}
