import { Suspense } from "react";
import { BottomNav, BottomNavFallback, SideNav, SideNavFallback } from "@/components/painel/bottom-nav";

export default function PainelLayout({ children }: LayoutProps<"/painel">) {
  return (
    <div className="min-h-dvh md:flex">
      <Suspense fallback={<SideNavFallback />}>
        <SideNav />
      </Suspense>
      <div className="mx-auto w-full max-w-md pb-32 md:max-w-3xl md:px-4 md:pb-12 md:pt-4">{children}</div>
      <Suspense fallback={<BottomNavFallback />}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
