import type { Metadata } from "next";
import { ResultadoClient } from "@/components/resultado/ResultadoClient";

export const metadata: Metadata = {
  title: "Tu plan de acción — Pujazo",
  description:
    "Consulta el plan generado en local: fichaje prioritario, pujas, ventas, once, capitán y ariete.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResultadoPage() {
  return <ResultadoClient />;
}
