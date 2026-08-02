import { PageShell } from "@/components/layout/SiteChrome";
import { AnalyzerWizard } from "@/components/analyzer/AnalyzerWizard";

export default function AnalizarPage() {
  return (
    <PageShell compactHeader>
      <AnalyzerWizard />
    </PageShell>
  );
}
