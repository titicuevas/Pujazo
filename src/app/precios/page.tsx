import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/layout/SiteChrome";

export const metadata: Metadata = {
  title: "Gratis y futuro",
  description:
    "Pujazo es gratis hoy: análisis local sin cuenta. Más adelante podrá haber extras opcionales (sync, IA) sin quitar el modo local.",
};

const freeNow = [
  "Asistente completo de fichajes, ventas, pujas y alineación",
  "Pegar o capturar plantilla y mercado (auto-import si detecta jugadores)",
  "Plan en móvil con atajos a fichaje, ventas y once + PDF/compartir",
  "Historial local con comparar planes y copia JSON entre dispositivos",
];

const laterPaid = [
  {
    title: "Sync entre dispositivos",
    text: "Mismo historial en móvil y PC (requeriría cuenta).",
  },
  {
    title: "IA opcional y transparente",
    text: "Capa extra de consejo, siempre explicando el porqué — nunca opaca.",
  },
  {
    title: "Más comodidad",
    text: "Atajos o conectores con consentimiento explícito. Ya hay MVP local de extensión Chrome en el repo (sin tienda aún).",
  },
];

export default function PreciosPage() {
  return (
    <PageShell>
      <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-sm font-semibold text-lime">Modelo abierto</p>
        <h1 className="font-display mt-2 text-3xl font-bold text-ink sm:text-4xl">
          Gratis ahora. Extras opcionales después.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-foam">
          Hoy Pujazo está pensado para que cualquiera lo use sin fricción: pegas
          tus datos, recibes un plan y todo se queda en tu dispositivo. Si más
          adelante hay funciones de pago, el modo local gratuito seguirá
          existiendo.
        </p>

        <section className="mt-10 rounded-lg border border-lime/35 bg-lime/5 p-5 sm:p-6">
          <h2 className="font-display text-2xl font-bold text-ink">
            Plan gratuito (actual)
          </h2>
          <p className="mt-2 text-sm text-foam">
            0 € · Sin cuenta · Sin cookies de seguimiento
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foam">
            {freeNow.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Link
            href="/analizar?pegar=1"
            className="cta-primary mt-6 inline-flex px-4 py-2.5 text-sm"
          >
            Empezar gratis
          </Link>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold text-ink">
            Posible plan de pago (futuro)
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-foam">
            Aún <strong className="text-ink">no está disponible</strong> y no se
            cobra nada. Cuando lo activemos, será opt-in: solo si quieres sync,
            IA u otros extras. Te pediremos consentimiento claro antes de
            subir datos a la nube.
          </p>
          <ul className="mt-5 space-y-4">
            {laterPaid.map((item) => (
              <li
                key={item.title}
                className="border-l-2 border-[var(--line)] pl-4"
              >
                <p className="font-display text-lg font-semibold text-ink">
                  {item.title}{" "}
                  <span className="text-sm font-medium text-mist">
                    · próximamente
                  </span>
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foam">
                  {item.text}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 border-t border-[var(--line)] pt-8 text-sm leading-relaxed text-foam">
          <h2 className="font-display text-xl font-semibold text-ink">
            Compromiso
          </h2>
          <p className="mt-2">
            No vamos a obligarte a crear cuenta para lo que hoy ya funciona.
            El núcleo local-first es la base del producto. Detalles de
            privacidad en{" "}
            <Link
              href="/privacidad"
              className="font-semibold text-lime underline-offset-2 hover:underline"
            >
              Privacidad
            </Link>
            .
          </p>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/analizar" className="cta-primary px-4 py-2.5 text-sm">
            Abrir asistente
          </Link>
          <Link href="/como-usar" className="cta-secondary px-4 py-2.5 text-sm">
            Cómo usar
          </Link>
        </div>
      </article>
    </PageShell>
  );
}
