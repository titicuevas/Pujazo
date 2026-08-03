"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
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
    <html lang="es">
      <body className="min-h-screen bg-[#0b1f17] text-[#e8f5e9] antialiased">
        <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-4 px-4 py-10">
          <p className="text-sm font-semibold text-[#9fd400]">Pujazo</p>
          <h1 className="text-3xl font-bold">Algo ha fallado</h1>
          <p className="text-sm leading-relaxed text-[#b7c9bc]">
            Ha ocurrido un error inesperado. Puedes reintentar o volver al
            inicio. Tus datos locales no se envían a ningún servidor.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-md bg-[#9fd400] px-4 py-2.5 text-sm font-semibold text-[#0b1f17]"
            >
              Reintentar
            </button>
            <Link
              href="/"
              className="rounded-md border border-[#2a4a3a] px-4 py-2.5 text-sm"
            >
              Ir al inicio
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
