import type { Metadata } from "next";
import { Suspense } from "react";
import { PageShell } from "@/components/layout/SiteChrome";
import { AnalyzerWizard } from "@/components/analyzer/AnalyzerWizard";

export const metadata: Metadata = {
  title: "Analizar mi equipo — Pujazo",
  description:
    "Introduce plataforma, plantilla, mercado y reglas. Pujazo genera un plan local de fichajes, pujas, ventas y alineación.",
};

function AnalizarFallback() {
  return (
    <p className="px-4 py-10 text-mist" role="status">
      Calentando en el vestuario…
    </p>
  );
}

export default function AnalizarPage() {
  return (
    <PageShell compactHeader>
      <Suspense fallback={<AnalizarFallback />}>
        <AnalyzerWizard />
      </Suspense>
    </PageShell>
  );
}
