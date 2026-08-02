import Link from "next/link";
import type { ReactNode } from "react";

function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color:var(--panel-strong)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
        <Link
          href="/"
          className="font-display text-xl font-extrabold tracking-tight text-lime sm:text-2xl"
          aria-label="Pujazo, inicio"
        >
          Pujazo
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-1.5 sm:gap-3">
          {!compact && (
            <Link
              href="/#como-funciona"
              className="rounded-md px-2.5 py-2 text-sm font-medium text-foam transition hover:text-ink sm:px-3"
            >
              Cómo funciona
            </Link>
          )}
          <Link
            href="/analizar"
            className="cta-primary px-3 py-2 text-sm"
          >
            <span className="sm:hidden">Analizar</span>
            <span className="hidden sm:inline">Analizar mi equipo</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-pitch-950/90">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2.5 px-4 py-7 text-sm text-foam sm:px-6 sm:py-8">
        <p className="font-display text-lg font-bold text-lime">Pujazo</p>
        <p className="leading-relaxed text-foam">
          Asistente independiente para fantasy fútbol en España. Sin conexión a
          cuentas, sin automatización de fichajes y sin datos en tiempo real.
        </p>
        <p className="text-xs leading-relaxed text-mist">
          Pujazo es una herramienta independiente y no está afiliada ni
          respaldada por Biwenger, Comunio, LALIGA FANTASY ni otras plataformas
          mencionadas.
        </p>
      </div>
    </footer>
  );
}

export function PageShell({
  children,
  compactHeader = false,
}: {
  children: ReactNode;
  compactHeader?: boolean;
}) {
  return (
    <>
      <SiteHeader compact={compactHeader} />
      <main id="contenido-principal" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
