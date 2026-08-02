/**
 * Vista previa del producto en la home: muestra qué entrega Pujazo,
 * sin gráficos abstractos ni logos de terceros.
 */
export function HeroPreview() {
  return (
    <aside
      className="animate-rise-delay-2 rounded-xl border border-[var(--line)] bg-pitch-900/90 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:p-5"
      aria-label="Ejemplo de plan que genera Pujazo"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-mist">
        Ejemplo de resultado
      </p>
      <p className="font-display mt-1 text-lg font-bold text-ink sm:text-xl">
        Tu plan de acción
      </p>

      <div className="mt-4 space-y-3">
        <div className="rounded-lg border border-[var(--line)] bg-pitch-950/70 p-3">
          <p className="text-xs text-mist">Fichaje prioritario</p>
          <p className="mt-1 font-semibold text-ink">Y. Cordero · Delantero</p>
          <p className="mt-2 text-sm text-foam">
            Puja recomendada{" "}
            <span className="font-semibold text-[#04110c] rounded bg-lime px-1.5 py-0.5">
              9.450.000 €
            </span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-risky/40 bg-risky/15 px-3 py-2">
            <p className="text-xs text-mist">Aviso</p>
            <p className="text-sm font-semibold text-risky">Vender antes</p>
          </div>
          <div className="rounded-lg border border-safe/40 bg-safe/15 px-3 py-2">
            <p className="text-xs text-mist">Riesgo</p>
            <p className="text-sm font-semibold text-safe">Medio</p>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-pitch-950/70 p-3">
          <p className="text-xs text-mist">Ventas sugeridas</p>
          <ul className="mt-1 space-y-1 text-sm text-foam">
            <li>H. Ballester</li>
            <li>J. Ferrera</li>
          </ul>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-pitch-950/70 p-3">
          <p className="text-xs text-mist">Once · 4-3-3</p>
          <p className="mt-1 text-sm text-foam">
            Capitán <span className="font-semibold text-ink">C. Aranda</span>
            {" · "}
            Ariete <span className="font-semibold text-ink">D. Prado</span>
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-mist">
        Así se ve un plan generado en local a partir de tus datos.
      </p>
    </aside>
  );
}
