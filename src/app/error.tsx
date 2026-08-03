"use client";

import { useEffect } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/SiteChrome";
import { Button } from "@/components/ui/Primitives";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageShell compactHeader>
      <div className="mx-auto w-full max-w-lg px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-display text-3xl font-bold text-ink">
          Algo ha fallado
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foam">
          Ha ocurrido un error al cargar esta página. Prueba de nuevo o vuelve
          al asistente.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" onClick={reset}>
            Reintentar
          </Button>
          <Link href="/analizar" className="cta-secondary px-4 py-2.5 text-sm">
            Ir al asistente
          </Link>
          <Link href="/" className="cta-secondary px-4 py-2.5 text-sm">
            Inicio
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
