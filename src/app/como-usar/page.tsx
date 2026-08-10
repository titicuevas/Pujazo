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
    text: "Pega texto o elige una captura: si detecta varios jugadores, se importan solos. Revisa nombres y precios; evita carteles borrosos o decorativos.",
  },
  {
    title: "Revisa y genera el plan",
    text: "Completa lo que falte (saldo, reglas, tipo de análisis) y pulsa Generar plan.",
  },
  {
    title: "Guarda o comparte",
    text: "Copia, descarga, imprime/PDF o revisa el historial local. En el móvil puedes instalar Pujazo en la pantalla de inicio.",
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
            Cada jornada
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-foam">
            En el resultado,{" "}
            <strong className="text-ink">Siguiente jornada</strong> reutiliza
            tu plantilla y reglas, vacía el mercado y te lleva a pegar el
            mercado nuevo. Usa la checklist de acciones para marcar ventas y
            pujas hechas.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foam">
            Si instalas Pujazo como app y te quedas sin red, verás una pantalla
            offline con atajos al último resultado y al historial (todo local).
          </p>
        </section>

        <section className="mt-10 border-t border-[var(--line)] pt-8">
          <h2 className="font-display text-xl font-semibold text-ink">
            Extensión Chrome (PC)
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-foam">
            En la carpeta <strong className="text-ink">extension/</strong> del
            repo hay un complemento local: abre Biwenger web → plantilla o
            mercado → icono Pujazo → “Copiar y abrir Pujazo”. Por defecto abre{" "}
            <strong className="text-ink">pujazo.vercel.app</strong> (puedes
            cambiar la URL en el popup). No sube datos; solo usa el
            portapapeles. Instrucciones en{" "}
            <code className="text-ink">extension/README.md</code>.
          </p>
        </section>

        <section className="mt-10 border-t border-[var(--line)] pt-8">
          <h2 className="font-display text-xl font-semibold text-ink">
            ¿No puedes copiar desde el móvil?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-foam">
            Con Pujazo <strong className="text-ink">instalada</strong> en el
            móvil: en Biwenger pulsa{" "}
            <strong className="text-ink">Compartir</strong> → elige{" "}
            <strong className="text-ink">Pujazo</strong>. El texto (#Biwenger)
            entra solo en el asistente. Si no aparece, pégalo a mano o usa
            captura de la lista.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foam">
            <li>
              Ese share suele traer <strong className="text-ink">solo nombres</strong>
              : completa valores después, o usa captura de la lista con precios.
            </li>
            <li>
              <strong className="text-ink">Elegir captura / foto</strong> abre la
              galería (mejor la lista con precios, no el cartel decorativo). Si
              reconoce jugadores, los carga en la plantilla/mercado al momento.
            </li>
            <li>
              En PC, pegar la plantilla/mercado completo o la extensión Chrome
              sigue siendo lo más fiable.
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
