import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/layout/SiteChrome";

export const metadata: Metadata = {
  title: "Cómo usar Pujazo",
  description:
    "Guía rápida: elige plataforma, pega plantilla y mercado, genera tu plan de fichajes y pujas. Todo en tu dispositivo.",
};

const steps = [
  {
    title: "Elige tu fantasy",
    text: "Biwenger, Comunio, LALIGA FANTASY u otra. Puedes cargar datos de ejemplo o un preset de reglas.",
  },
  {
    title: "Pega plantilla y mercado",
    text: "Pega texto o usa “Importar con captura” (foto de la app). Revisa lo detectado e importa. Evita capturas borrosas.",
  },
  {
    title: "Revisa y genera el plan",
    text: "Completa lo que falte (saldo, reglas, tipo de análisis) y pulsa Generar plan.",
  },
  {
    title: "Guarda o comparte",
    text: "Copia, descarga, imprime/PDF o revisa el historial local. Al generar otro plan, el anterior queda archivado aquí.",
  },
];

export default function ComoUsarPage() {
  return (
    <PageShell>
      <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
          Cómo usar Pujazo
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-foam">
          En cuatro pasos tienes un plan de fichajes, ventas, pujas y
          alineación. Sin cuentas ni datos enviados a un servidor.
        </p>

        <ol className="mt-8 space-y-6">
          {steps.map((step, index) => (
            <li key={step.title} className="border-l-2 border-lime pl-4">
              <p className="font-display text-sm font-bold text-lime">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold text-ink">
                {step.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-foam">
                {step.text}
              </p>
            </li>
          ))}
        </ol>

        <section className="mt-10 border-t border-[var(--line)] pt-8">
          <h2 className="font-display text-xl font-semibold text-ink">
            Tips de pegado
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foam">
            <li>
              <strong className="text-ink">Biwenger:</strong> Equipo → Plantilla
              (no Alineación). En mercado, evita “Todos los jugadores”.
            </li>
            <li>
              <strong className="text-ink">Comunio:</strong> lista con POR /
              DEF / MED / DEL y valor; los clubes se ignoran.
            </li>
            <li>
              <strong className="text-ink">LALIGA FANTASY:</strong> fichas con
              posición, Valor y Cláusula si aparecen.
            </li>
            <li>
              Si falla la importación, Pujazo te muestra un consejo concreto
              según la plataforma.
            </li>
          </ul>
        </section>

        <section className="mt-10 border-t border-[var(--line)] pt-8">
          <h2 className="font-display text-xl font-semibold text-ink">
            ¿No puedes copiar desde el móvil?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-foam">
            En Biwenger la vía más fácil es{" "}
            <strong className="text-ink">Compartir</strong> el mercado o la
            plantilla: te genera un texto con{" "}
            <strong className="text-ink">#Biwenger</strong> y los nombres. Pégalo
            en Pujazo.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foam">
            <li>
              Ese share suele traer <strong className="text-ink">solo nombres</strong>
              : completa valores después, o usa captura de la lista con precios.
            </li>
            <li>
              <strong className="text-ink">Importar con captura</strong> funciona
              mejor con la lista real (botones Vender/Pujar), no con el cartel
              decorativo de “compartir imagen”.
            </li>
            <li>
              En PC, pegar la plantilla/mercado completo sigue siendo lo más
              fiable.
            </li>
          </ul>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/analizar?pegar=1" className="cta-primary px-4 py-2.5 text-sm">
            Empezar pegando plantilla
          </Link>
          <Link href="/analizar" className="cta-secondary px-4 py-2.5 text-sm">
            Abrir asistente
          </Link>
          <Link href="/privacidad" className="cta-secondary px-4 py-2.5 text-sm">
            Privacidad
          </Link>
          <Link href="/precios" className="cta-secondary px-4 py-2.5 text-sm">
            Gratis / futuro
          </Link>
        </div>
      </article>
    </PageShell>
  );
}
