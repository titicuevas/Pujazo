import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/layout/SiteChrome";
import { INDEPENDENCE_NOTICE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacidad",
  description:
    "Pujazo procesa tus datos en el navegador. Sin cuentas, sin base de datos y sin enviar plantilla ni mercado a un servidor.",
};

export default function PrivacidadPage() {
  return (
    <PageShell>
      <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
          Privacidad
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-foam">
          Pujazo está pensado para que tu liga se quede en tu dispositivo.
        </p>

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-foam">
          <h2 className="font-display text-xl font-semibold text-ink">
            Qué hacemos con tus datos
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              El análisis se calcula <strong className="text-ink">en tu navegador</strong>.
              No hace falta crear cuenta.
            </li>
            <li>
              Plantilla, mercado, reglas, último plan e historial se guardan en{" "}
              <strong className="text-ink">localStorage</strong> de este
              dispositivo.
            </li>
            <li>
              <strong className="text-ink">No enviamos</strong> tu plantilla,
              saldo ni mercado a un servidor de Pujazo.
            </li>
            <li>
              No nos conectamos a Biwenger, Comunio ni LALIGA FANTASY. Tú pegas
              el texto; nosotros lo interpretamos aquí.
            </li>
          </ul>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-foam">
          <h2 className="font-display text-xl font-semibold text-ink">
            Qué no hacemos
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>No pedimos usuario ni contraseña de tu fantasy.</li>
            <li>No hacemos scraping ni automatizamos fichajes o pujas.</li>
            <li>
              No hay base de datos nuestra con tu historial (el historial es
              solo local).
            </li>
          </ul>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-foam">
          <h2 className="font-display text-xl font-semibold text-ink">
            Control en tu dispositivo
          </h2>
          <p>
            En el asistente puedes borrar todos los datos locales de Pujazo.
            También puedes vaciar el historial o borrar entradas sueltas. Si
            cambias de móvil o borras datos del navegador, esos planes
            desaparecen: no hay copia en la nube.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-foam">
          <h2 className="font-display text-xl font-semibold text-ink">
            Independencia
          </h2>
          <p>{INDEPENDENCE_NOTICE}</p>
        </section>

        <p className="mt-8 text-xs text-mist">
          Última actualización: agosto 2026. Si en el futuro ofrecemos sync o
          funciones de pago, lo explicaremos con claridad antes de pedir datos
          o cuentas.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/analizar" className="cta-primary px-4 py-2.5 text-sm">
            Ir al asistente
          </Link>
          <Link href="/como-usar" className="cta-secondary px-4 py-2.5 text-sm">
            Cómo usar
          </Link>
        </div>
      </article>
    </PageShell>
  );
}
