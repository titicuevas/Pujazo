import Link from "next/link";
import type { ReactNode } from "react";

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color:var(--panel-strong)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="font-display text-2xl font-extrabold tracking-tight text-lime sm:text-3xl"
          aria-label="Pujazo, inicio"
        >
          Pujazo
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-2 sm:gap-3">
          {!compact && (
            <Link
              href="/#como-funciona"
              className="hidden rounded-md px-3 py-2 text-sm text-foam transition hover:text-ink sm:inline-flex"
            >
              Cómo funciona
            </Link>
          )}
          <Link
            href="/analizar"
            className="inline-flex items-center rounded-md bg-lime px-3 py-2 text-sm font-semibold text-on-lime transition hover:bg-lime-dim"
          >
            Analizar mi equipo
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-pitch-950/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-foam sm:px-6">
        <p className="font-display text-lg font-bold text-lime">Pujazo</p>
        <p>
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
