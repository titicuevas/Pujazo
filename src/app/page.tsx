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
        <div className="mx-auto grid min-h-[calc(100svh-3.5rem)] w-full max-w-6xl items-end gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pb-20 lg:pt-16">
          <div className="animate-rise">
            <p className="font-display mb-4 text-5xl font-extrabold tracking-tight text-lime sm:text-6xl md:text-7xl">
              Pujazo
            </p>
            <h1 className="font-display max-w-xl text-3xl font-bold leading-tight text-ink sm:text-4xl md:text-5xl">
              Tu plantilla. Tu mercado. Tu próximo movimiento.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-mist sm:text-lg">
              Introduce tu equipo, tu saldo, tu mercado y las reglas de tu liga.
              Pujazo te devuelve un plan claro de fichajes, ventas, pujas y
              alineación — sin conectar cuentas ni inventar datos en vivo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 animate-rise-delay-1">
              <Link
                href="/analizar"
                className="animate-cta-glow inline-flex items-center justify-center rounded-md bg-lime px-5 py-3 text-base font-semibold text-pitch-950 transition hover:bg-lime-dim"
              >
                Analizar mi equipo
              </Link>
              <Link
                href="/#como-funciona"
                className="inline-flex items-center justify-center rounded-md border border-[var(--line)] bg-pitch-800/50 px-5 py-3 text-base font-medium text-ink transition hover:bg-pitch-700"
              >
                Cómo funciona
              </Link>
            </div>
          </div>

          <div
            className="relative min-h-64 animate-rise-delay-2 overflow-hidden rounded-none border-y border-[var(--line)] lg:min-h-[28rem] lg:rounded-2xl lg:border"
            aria-hidden="true"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(184,242,0,0.25),transparent_45%),radial-gradient(circle_at_70%_70%,rgba(240,162,2,0.2),transparent_40%),linear-gradient(160deg,#123528,#06140f)]" />
            <div className="absolute inset-x-0 top-1/2 h-px bg-lime/30" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-lime/20" />
            <div className="absolute left-[12%] top-[18%] h-16 w-16 rounded-full border border-lime/40 bg-lime/10 blur-[1px]" />
            <div className="absolute bottom-[20%] right-[16%] h-24 w-24 rounded-full border border-amber/40 bg-amber/10" />
            <div className="absolute inset-0 flex items-end p-6 sm:p-8">
              <p className="font-display max-w-xs text-2xl font-bold leading-snug text-ink/90">
                Plan local. Decisiones tuyas. Cero magia opaca.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="ventajas-title">
        <h2
          id="ventajas-title"
          className="font-display text-3xl font-bold text-ink sm:text-4xl"
        >
          Ventajas
        </h2>
        <p className="mt-3 max-w-2xl text-mist">
          Un asistente pensado para decidir rápido en el mercado, no para
          sustituir tu criterio.
        </p>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {advantages.map((item) => (
            <li key={item.title} className="border-t border-lime/25 pt-4">
              <h3 className="font-display text-xl font-semibold text-lime">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-mist">{item.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section
        id="como-funciona"
        className="border-y border-[var(--line)] bg-pitch-900/50"
        aria-labelledby="como-title"
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h2
            id="como-title"
            className="font-display text-3xl font-bold text-ink sm:text-4xl"
          >
            Cómo funciona
          </h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <li key={step.n} className="flex flex-col gap-3">
                <span className="font-display text-4xl font-extrabold text-lime/40">
                  {step.n}
                </span>
                <h3 className="font-display text-xl font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="text-sm text-mist">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6" aria-label="Aviso de independencia">
        <p className="rounded-xl border border-amber/30 bg-amber/10 px-4 py-4 text-sm leading-relaxed text-foam sm:px-5">
          {INDEPENDENCE_NOTICE}
        </p>
      </section>
    </PageShell>
  );
}
