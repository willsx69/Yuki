import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Yuki — Controle de gastos",
    short_name: "Yuki",
    description: "Controle de gastos: transações, contas, dívidas e relatórios.",
    lang: "pt-BR",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8f7fc",
    theme_color: "#f8f7fc",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
