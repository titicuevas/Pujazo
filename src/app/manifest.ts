import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pujazo",
    short_name: "Pujazo",
    description:
      "Asistente de fantasy fútbol: fichajes, pujas, ventas y alineación. Todo en tu dispositivo.",
    start_url: "/analizar?pegar=1",
    scope: "/",
    display: "standalone",
    background_color: "#06140f",
    theme_color: "#0b1f17",
    lang: "es-ES",
    orientation: "portrait-primary",
    categories: ["sports", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
