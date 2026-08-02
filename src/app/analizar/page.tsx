import type { Metadata } from "next";
import { PageShell } from "@/components/layout/SiteChrome";
import { AnalyzerWizard } from "@/components/analyzer/AnalyzerWizard";

export const metadata: Metadata = {
  title: "Analizar mi equipo — Pujazo",
  description:
    "Introduce plataforma, plantilla, mercado y reglas. Pujazo genera un plan local de fichajes, pujas, ventas y alineación.",
};

export default function AnalizarPage() {
  return (
    <PageShell compactHeader>
      <AnalyzerWizard />
    </PageShell>
  );
}
