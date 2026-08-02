import Link from "next/link";
import { PageShell } from "@/components/layout/SiteChrome";
import { HeroPreview } from "@/components/home/HeroPreview";
import { INDEPENDENCE_NOTICE } from "@/lib/constants";

const advantages = [
  {
    title: "Fichajes personalizados",
    text: "Prioriza candidatos según tu cupo, saldo y estrategia.",
  },
  {
    title: "Puja recomendada",
    text: "Te propone puja objetivo y techo máximo con margen.",
  },
  {
    title: "Ventas necesarias",
    text: "Detecta si debes vender antes de fichar y a quién.",
  },
  {
    title: "Once, capitán y ariete",
    text: "Arma una alineación válida con tus reglas de liga.",
  },
  {
    title: "Reglas adaptadas a cada liga",
    text: "Capitán, ariete, cláusulas, cesiones y notas propias.",
  },
];

const steps = [
  {
    n: "01",
    title: "Introduce tu contexto",
    text: "Plataforma, plantilla, saldo, mercado y reglas.",
  },
  {
    n: "02",
    title: "Elige el tipo de análisis",
    text: "Mercado, ventas, alineación o revisión completa.",
  },
  {
    n: "03",
    title: "Recibe un plan accionable",
    text: "Fichaje, puja, ventas, once y plan B, todo en local.",
  },
];

export default function HomePage() {
  return (
    <PageShell>
      <section className="relative overflow-hidden hero-sheen">
        <div className="mx-auto grid w-full max-w-6xl items-start gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8 md:py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:py-12">
          <div className="animate-rise order-1">
            <p className="font-display mb-2 text-4xl font-extrabold tracking-tight text-lime sm:mb-3 sm:text-5xl md:text-6xl">
              Pujazo
            </p>
            <h1 className="font-display max-w-xl text-2xl font-bold leading-tight text-ink sm:text-3xl md:text-4xl">
              Tu plantilla. Tu mercado. Tu próximo movimiento.
            </h1>
            <p className="mt-3 max-w-lg text-base leading-relaxed text-foam sm:mt-4 sm:text-lg">
              Introduce tu equipo, tu saldo, tu mercado y las reglas de tu liga.
              Pujazo te devuelve un plan claro de fichajes, ventas, pujas y
              alineación — sin conectar cuentas ni inventar datos en vivo.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:flex-wrap animate-rise-delay-1">
              <Link
                href="/analizar"
                className="cta-primary animate-cta-glow px-5 py-3 text-base"
              >
                Analizar mi equipo
              </Link>
              <Link
                href="/#como-funciona"
                className="cta-secondary px-5 py-3 text-base"
              >
                Cómo funciona
              </Link>
            </div>
          </div>

          <div className="order-2">
            <HeroPreview />
          </div>
        </div>
      </section>

      <section
        className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10"
        aria-labelledby="ventajas-title"
      >
        <h2
          id="ventajas-title"
          className="font-display text-2xl font-bold text-ink sm:text-3xl"
        >
          Ventajas
        </h2>
        <p className="mt-2 max-w-2xl text-base text-foam">
          Un asistente pensado para decidir rápido en el mercado, no para
          sustituir tu criterio.
        </p>
        <ul className="mt-5 grid gap-4 sm:mt-6 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {advantages.map((item) => (
            <li
              key={item.title}
              className="border-l-2 border-lime pl-4 sm:border-l-0 sm:border-t sm:border-lime/50 sm:pl-0 sm:pt-3"
            >
              <h3 className="font-display text-lg font-semibold text-ink sm:text-xl">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-foam">
                {item.text}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section
        id="como-funciona"
        className="border-y border-[var(--line)] bg-pitch-900/60"
        aria-labelledby="como-title"
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <h2
            id="como-title"
            className="font-display text-2xl font-bold text-ink sm:text-3xl"
          >
            Cómo funciona
          </h2>
          <ol className="mt-5 grid gap-5 sm:mt-6 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
            {steps.map((step) => (
              <li key={step.n} className="flex flex-col gap-1.5">
                <span className="font-display text-3xl font-extrabold text-lime sm:text-4xl">
                  {step.n}
                </span>
                <h3 className="font-display text-lg font-semibold text-ink sm:text-xl">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-foam">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-9"
        aria-label="Aviso de independencia"
      >
        <p className="rounded-xl border border-amber/50 bg-amber/15 px-4 py-3.5 text-sm leading-relaxed text-ink sm:px-5">
          {INDEPENDENCE_NOTICE}
        </p>
      </section>
    </PageShell>
  );
}
