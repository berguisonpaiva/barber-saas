import type { Metadata, Viewport } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  title: { default: "Barber SaaS", template: "%s · Barber SaaS" },
  description: "Agendamento online para barbearias.",
  applicationName: "Barber SaaS",
  appleWebApp: { capable: true, title: "Barber SaaS", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0b0907",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" data-theme="dark" className={`${manrope.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full bg-canvas text-fg">{children}</body>
    </html>
  );
}
