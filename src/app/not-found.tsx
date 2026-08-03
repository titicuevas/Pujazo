import Link from "next/link";
import { PageShell } from "@/components/layout/SiteChrome";

export default function NotFoundPage() {
  return (
    <PageShell compactHeader>
      <div className="mx-auto w-full max-w-lg px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-sm font-semibold text-lime">404</p>
        <h1 className="font-display mt-2 text-3xl font-bold text-ink">
          Página no encontrada
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foam">
          Esa ruta no existe en Pujazo. Vuelve al inicio o abre el asistente
          para analizar tu equipo.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/" className="cta-primary px-4 py-2.5 text-sm">
            Ir al inicio
          </Link>
          <Link href="/analizar" className="cta-secondary px-4 py-2.5 text-sm">
            Analizar mi equipo
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
