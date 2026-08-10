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
            También puedes vaciar el historial o borrar entradas sueltas. En{" "}
            <Link href="/historial" className="font-semibold text-ink underline-offset-2 hover:underline">
              Historial
            </Link>{" "}
            puedes <strong className="text-ink">exportar/importar un JSON</strong>{" "}
            para llevar borrador y planes a otro dispositivo sin cuenta ni nube
            de Pujazo. Si borras datos del navegador sin haber exportado, esos
            planes desaparecen.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-foam">
          <h2 className="font-display text-xl font-semibold text-ink">
            Independencia
          </h2>
          <p>{INDEPENDENCE_NOTICE}</p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-foam">
          <h2 className="font-display text-xl font-semibold text-ink">
            Si en el futuro hay cuentas o pago
          </h2>
          <p>
            El uso gratuito local seguirá siendo la base. Cualquier sync, IA u
            otro extra de pago será opcional y se explicará antes de pedir
            cuenta o enviar datos fuera de tu dispositivo. Más detalle en{" "}
            <Link
              href="/precios"
              className="font-semibold text-lime underline-offset-2 hover:underline"
            >
              Gratis / futuro
            </Link>
            .
          </p>
        </section>

        <p className="mt-8 text-xs text-mist">
          Última actualización: agosto 2026.
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
