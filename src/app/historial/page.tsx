import type { Metadata } from "next";
import { HistorialClient } from "@/components/historial/HistorialClient";

export const metadata: Metadata = {
  title: "Historial de planes — Pujazo",
  description:
    "Consulta análisis anteriores guardados en este dispositivo y vuelve a abrirlos.",
  robots: { index: false, follow: false },
};

export default function HistorialPage() {
  return <HistorialClient />;
}
