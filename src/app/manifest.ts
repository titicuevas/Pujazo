import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const manifest = {
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
    shortcuts: [
      {
        name: "Analizar equipo",
        short_name: "Analizar",
        description: "Abrir el asistente para pegar plantilla o mercado",
        url: "/analizar?pegar=1",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Último resultado",
        short_name: "Resultado",
        description: "Ver el último plan guardado en este dispositivo",
        url: "/resultado",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Historial de planes",
        short_name: "Historial",
        description: "Comparar planes y exportar copia local",
        url: "/historial",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
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
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    // Recibir “Compartir” desde Biwenger u otras apps (texto local, sin servidor)
    share_target: {
      action: "/importar-share",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        title: "title",
        text: "text",
        url: "url",
      },
    },
  };

  return manifest as MetadataRoute.Manifest;
}
