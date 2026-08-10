import Link from "next/link";
import type { ReactNode } from "react";

function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      width="28"
      height="28"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="#0a1c14" />
      <path
        fill="#9fd400"
        d="M8.5 24V8.2h7.1c3.35 0 5.55 1.95 5.55 4.85 0 2.95-2.2 4.9-5.55 4.9H12.2V24H8.5zm3.7-9.55h3.2c1.55 0 2.45-.85 2.45-2.15s-.9-2.1-2.45-2.1h-3.2v4.25z"
      />
      <path
        fill="#eef8b8"
        d="M22.2 22.8 26.4 16l-2.15-.05V11.2h-2.1v4.75L20 16l2.2 6.8z"
      />
    </svg>
  );
}

function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color:var(--panel-strong)] pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
        <Link
          href="/"
          className="font-display inline-flex min-w-0 shrink items-center gap-1.5 text-lg font-extrabold tracking-tight text-lime sm:gap-2.5 sm:text-2xl"
          aria-label="Pujazo, inicio"
        >
          <BrandMark className="shrink-0 rounded-md ring-1 ring-lime/30" />
          <span className="truncate">Pujazo</span>
        </Link>
        <nav
          aria-label="Principal"
          className="flex shrink-0 items-center gap-0.5 sm:gap-3"
        >
          {!compact && (
            <Link
              href="/como-usar"
              className="hidden rounded-md px-2.5 py-2 text-sm font-medium text-foam transition hover:text-ink sm:inline-flex sm:px-3"
            >
              Cómo usar
            </Link>
          )}
          <Link
            href="/historial"
            className="rounded-md px-2 py-2 text-sm font-medium text-foam transition hover:text-ink sm:px-3"
          >
            Historial
          </Link>
          <Link href="/analizar" className="cta-primary px-3 py-2 text-sm">
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
    <footer className="mt-auto border-t border-[var(--line)] bg-pitch-950/90 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-7 text-sm text-foam sm:px-6 sm:py-8">
        <p className="font-display inline-flex items-center gap-2 text-lg font-bold text-lime">
          <BrandMark className="rounded-md ring-1 ring-lime/30" />
          Pujazo
        </p>
        <p className="leading-relaxed text-foam">
          Asistente independiente para fantasy fútbol en España. Sin conexión a
          cuentas, sin automatización de fichajes y sin datos en tiempo real.
        </p>
        <nav
          aria-label="Pie de página"
          className="flex flex-wrap gap-x-4 gap-y-2 text-sm"
        >
          <Link
            href="/como-usar"
            className="text-mist underline-offset-2 transition hover:text-ink hover:underline"
          >
            Cómo usar
          </Link>
          <Link
            href="/precios"
            className="text-mist underline-offset-2 transition hover:text-ink hover:underline"
          >
            Gratis / futuro
          </Link>
          <Link
            href="/privacidad"
            className="text-mist underline-offset-2 transition hover:text-ink hover:underline"
          >
            Privacidad
          </Link>
          <Link
            href="/historial"
            className="text-mist underline-offset-2 transition hover:text-ink hover:underline"
          >
            Historial
          </Link>
          <Link
            href="/analizar"
            className="text-mist underline-offset-2 transition hover:text-ink hover:underline"
          >
            Analizar
          </Link>
        </nav>
        <p className="text-xs leading-relaxed text-mist">
          Puedes instalar Pujazo en el móvil (Añadir a pantalla de inicio /
          Instalar app). Tus datos siguen en el dispositivo.
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
