import Link from "next/link";
import { PageShell } from "@/components/layout/SiteChrome";
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
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-8 sm:gap-10 sm:px-6 sm:py-10 md:py-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12 lg:py-14">
          <div className="animate-rise order-1">
            <p className="font-display mb-2 text-4xl font-extrabold tracking-tight text-lime sm:mb-3 sm:text-5xl md:text-6xl">
              Pujazo
            </p>
            <h1 className="font-display max-w-xl text-2xl font-bold leading-tight text-ink sm:text-3xl md:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              Tu plantilla. Tu mercado. Tu próximo movimiento.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-foam sm:mt-5 sm:text-lg">
              Introduce tu equipo, tu saldo, tu mercado y las reglas de tu liga.
              Pujazo te devuelve un plan claro de fichajes, ventas, pujas y
              alineación — sin conectar cuentas ni inventar datos en vivo.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:flex-wrap animate-rise-delay-1">
              <Link
                href="/analizar"
                className="animate-cta-glow inline-flex items-center justify-center rounded-md bg-lime px-5 py-3 text-base font-semibold text-on-lime transition hover:bg-lime-dim"
              >
                Analizar mi equipo
              </Link>
              <Link
                href="/#como-funciona"
                className="inline-flex items-center justify-center rounded-md border-2 border-mist/50 bg-pitch-800/70 px-5 py-3 text-base font-medium text-ink transition hover:border-lime/60 hover:bg-pitch-700"
              >
                Cómo funciona
              </Link>
            </div>
          </div>

          <div
            className="relative order-2 min-h-44 animate-rise-delay-2 overflow-hidden rounded-xl border border-[var(--line)] sm:min-h-52 lg:min-h-[22rem]"
            aria-hidden="true"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,255,63,0.28),transparent_45%),radial-gradient(circle_at_70%_70%,rgba(255,204,51,0.22),transparent_40%),linear-gradient(160deg,#1c4a37,#050f0b)]" />
            <div className="absolute inset-x-0 top-1/2 h-px bg-lime/40" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-lime/25" />
            <div className="absolute left-[12%] top-[18%] h-12 w-12 rounded-full border border-lime/50 bg-lime/15 sm:h-16 sm:w-16" />
            <div className="absolute bottom-[18%] right-[14%] h-16 w-16 rounded-full border border-amber/50 bg-amber/15 sm:h-20 sm:w-20" />
            <div className="absolute inset-0 flex items-end p-4 sm:p-6 lg:p-7">
              <p className="font-display max-w-xs text-lg font-bold leading-snug text-ink sm:text-xl lg:text-2xl">
                Plan local. Decisiones tuyas. Cero magia opaca.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12"
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
        <ul className="mt-6 grid gap-5 sm:mt-7 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {advantages.map((item) => (
            <li
              key={item.title}
              className="border-l-2 border-lime pl-4 sm:border-l-0 sm:border-t sm:border-lime/40 sm:pl-0 sm:pt-3"
            >
              <h3 className="font-display text-lg font-semibold text-ink sm:text-xl">
                <span className="text-lime">{item.title}</span>
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-foam sm:text-[0.95rem]">
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
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <h2
            id="como-title"
            className="font-display text-2xl font-bold text-ink sm:text-3xl"
          >
            Cómo funciona
          </h2>
          <ol className="mt-6 grid gap-6 sm:mt-7 sm:grid-cols-2 md:grid-cols-3 md:gap-7">
            {steps.map((step) => (
              <li key={step.n} className="flex flex-col gap-2">
                <span className="font-display text-3xl font-extrabold text-lime sm:text-4xl">
                  {step.n}
                </span>
                <h3 className="font-display text-lg font-semibold text-ink sm:text-xl">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-foam sm:text-[0.95rem]">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10"
        aria-label="Aviso de independencia"
      >
        <p className="rounded-xl border border-amber/45 bg-amber/15 px-4 py-3.5 text-sm leading-relaxed text-ink sm:px-5">
          {INDEPENDENCE_NOTICE}
        </p>
      </section>
    </PageShell>
  );
}
