import type { MetadataRoute } from "next";

/** RF-14: PWA instalável (painel do proprietário). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Barber SaaS — Painel",
    short_name: "Barber",
    description: "Agenda e notificações da sua barbearia.",
    start_url: "/painel/agenda",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0907",
    theme_color: "#0b0907",
    lang: "pt-BR",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
