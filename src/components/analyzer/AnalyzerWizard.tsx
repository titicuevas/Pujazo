"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ANALYSIS_TYPE_OPTIONS,
  EXAMPLE_LEAGUE_RULES,
  PLATFORM_OPTIONS,
  POSITION_OPTIONS,
  STATUS_OPTIONS,
  STRATEGY_OPTIONS,
} from "@/lib/constants";
import {
  createDefaultFormValues,
  createDemoFormValues,
  createEmptyMarketPlayer,
  createEmptySquadPlayer,
} from "@/lib/demo";
import { formatMoney } from "@/lib/format";
import { analysisFormSchema, type AnalysisFormValues } from "@/lib/schemas";
import { countByPosition } from "@/lib/analysis";
import {
  clearAllLocalData,
  loadCustomRules,
  loadFormDraft,
  saveCustomRules,
  saveFormDraft,
  saveLastAnalysis,
} from "@/lib/storage";
import { analyzeTeam } from "@/lib/analysis";
import {
  Button,
  Field,
  Panel,
  ProgressBar,
  TextArea,
  TextInput,
  TextSelect,
} from "@/components/ui/Primitives";

const STEPS = [
  "Plataforma",
  "Liga",
  "Plantilla",
  "Presupuesto",
  "Reglas",
  "Análisis",
] as const;

const STEP_SHORT = [
  "Plat.",
  "Liga",
  "Plant.",
  "Presup.",
  "Reglas",
  "Análisis",
] as const;

const choiceClass = (selected: boolean) =>
  `flex cursor-pointer gap-3 rounded-lg border p-3 transition ${
    selected
      ? "border-lime bg-lime/10"
      : "border-[var(--line)] hover:border-lime/40"
  }`;

export function AnalyzerWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const hydratedRef = useRef(false);

  const methods = useForm<AnalysisFormValues>({
    resolver: zodResolver(analysisFormSchema) as never,
    defaultValues: createDefaultFormValues(),
    mode: "onBlur",
  });

  const { handleSubmit, reset, setValue, trigger, getValues, control } =
    methods;

  function scrollToPanelError() {
    requestAnimationFrame(() => {
      const panel = document.getElementById("analyzer-panel");
      const target =
        panel?.querySelector<HTMLElement>(
          '[role="alert"], [aria-invalid="true"]',
        ) ?? panel;
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const draft = loadFormDraft();
    const rules = loadCustomRules();

    queueMicrotask(() => {
      if (draft) {
        reset({
          ...draft,
          rules: rules ?? draft.rules,
        });
        setBanner(
          "Se ha recuperado el último borrador guardado en este dispositivo.",
        );
      } else if (rules) {
        setValue("rules", rules);
      }
      setReady(true);
    });
  }, [reset, setValue]);

  const draftValues = useWatch({ control });

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      saveFormDraft(getValues());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [draftValues, ready, getValues]);

  const stepFields: (keyof AnalysisFormValues | `rules.${string}`)[][] = [
    ["platform", "customPlatformName"],
    ["leagueName", "participants", "currentPosition", "matchday", "strategy"],
    ["squad"],
    ["balance", "maxPlayers", "allowNegativeBalance", "market"],
    ["rules"],
    ["analysisType", "concreteDoubt"],
  ];

  async function nextStep() {
    const fields = stepFields[step];
    const ok = await trigger(fields as never);
    if (!ok) {
      setBanner("Revisa los campos marcados antes de seguir.");
      scrollToPanelError();
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function goToStep(target: number) {
    if (target === step) return;
    if (target < step) {
      setStep(target);
      return;
    }
    for (let i = step; i < target; i++) {
      const ok = await trigger(stepFields[i] as never);
      if (!ok) {
        setStep(i);
        setBanner("Completa este paso antes de saltar adelante.");
        scrollToPanelError();
        return;
      }
    }
    setStep(target);
  }

  function loadDemo() {
    reset(createDemoFormValues());
    setBanner("Datos de ejemplo cargados. Revisa los pasos y genera el análisis.");
    setStep(0);
  }

  function loadExampleRules() {
    if (
      !window.confirm(
        "¿Cargar las reglas de ejemplo? Se sustituirán las reglas actuales de este borrador.",
      )
    ) {
      return;
    }
    setValue("rules", { ...EXAMPLE_LEAGUE_RULES }, { shouldDirty: true });
    setValue("maxPlayers", EXAMPLE_LEAGUE_RULES.maxPlayers, {
      shouldDirty: true,
    });
    saveCustomRules(EXAMPLE_LEAGUE_RULES);
    setBanner("Reglas de liga de ejemplo cargadas.");
  }

  function wipeLocal() {
    if (
      !window.confirm(
        "¿Borrar todos los datos locales de Pujazo en este dispositivo? No se puede deshacer.",
      )
    ) {
      return;
    }
    clearAllLocalData();
    reset(createDefaultFormValues());
    setBanner("Se han borrado todos los datos locales de Pujazo.");
    setStep(0);
  }

  const onSubmit = handleSubmit(
    (raw) => {
      const values = raw as AnalysisFormValues;
      const maxPlayers = values.rules.maxPlayers || values.maxPlayers;
      const synced: AnalysisFormValues = {
        ...values,
        maxPlayers,
        rules: {
          ...values.rules,
          maxPlayers,
        },
      };
      const result = analyzeTeam(synced);
      saveLastAnalysis(result, synced);
      saveCustomRules(synced.rules);
      saveFormDraft(synced);
      router.push("/resultado");
    },
    async () => {
      for (let i = 0; i < stepFields.length; i++) {
        const ok = await trigger(stepFields[i] as never);
        if (!ok) {
          setStep(i);
          setBanner("Hay campos que revisar en este paso.");
          scrollToPanelError();
          return;
        }
      }
    },
  );

  if (!ready) {
    return (
      <p className="px-4 py-10 text-mist" role="status">
        Cargando asistente…
      </p>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              Analizar mi equipo
            </h1>
            <p className="mt-1 text-sm text-mist">
              Paso {step + 1} de {STEPS.length}: {STEPS[step]}
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Button type="button" variant="secondary" onClick={loadDemo}>
              Probar con datos de ejemplo
            </Button>
            <Button type="button" variant="ghost" onClick={wipeLocal}>
              Borrar datos locales
            </Button>
          </div>
        </div>

        {banner ? (
          <div
            role="status"
            className="mb-4 flex items-start justify-between gap-3 rounded-md border border-lime/30 bg-lime/10 px-3 py-2 text-sm text-foam"
          >
            <p className="min-w-0">{banner}</p>
            <button
              type="button"
              className="shrink-0 text-mist underline-offset-2 hover:text-ink hover:underline"
              onClick={() => setBanner(null)}
              aria-label="Cerrar aviso"
            >
              Cerrar
            </button>
          </div>
        ) : null}

        <nav aria-label="Progreso del formulario" className="mb-6">
          <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {STEPS.map((label, index) => (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => void goToStep(index)}
                  className={`w-full rounded-md border px-2 py-2 text-left text-xs transition ${
                    index === step
                      ? "border-lime bg-lime/15 text-lime"
                      : index < step
                        ? "border-[var(--line)] bg-pitch-800 text-foam"
                        : "border-[var(--line)] text-mist"
                  }`}
                  aria-current={index === step ? "step" : undefined}
                >
                  <span className="block font-semibold">{index + 1}</span>
                  <span className="sm:hidden">{STEP_SHORT[index]}</span>
                  <span className="hidden sm:block">{label}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div id="analyzer-panel">
          <Panel>
            {step === 0 && <StepPlatform />}
            {step === 1 && <StepLeague />}
            {step === 2 && <StepSquad />}
            {step === 3 && <StepBudget />}
            {step === 4 && (
              <StepRules onLoadExample={loadExampleRules} />
            )}
            {step === 5 && <StepAnalysisType />}
          </Panel>
        </div>

        <div className="sticky bottom-0 z-10 -mx-4 mt-6 border-t border-[var(--line)] bg-pitch-950/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={prevStep}
              disabled={step === 0}
            >
              Anterior
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={() => void nextStep()}>
                Siguiente
              </Button>
            ) : (
              <Button type="submit">Generar plan</Button>
            )}
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

function StepPlatform() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<AnalysisFormValues>();
  const platform = watch("platform");

  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl font-semibold text-lime">
        Plataforma
      </h2>
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-foam">
          ¿En qué fantasy juegas?
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {PLATFORM_OPTIONS.map((option) => (
            <label
              key={option.id}
              className={`flex cursor-pointer flex-col gap-1 rounded-lg border p-3 transition ${
                platform === option.id
                  ? "border-lime bg-lime/10"
                  : "border-[var(--line)] hover:border-lime/40"
              }`}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  value={option.id}
                  {...register("platform")}
                  className="accent-[var(--lime)]"
                />
                <span className="font-semibold text-ink">{option.label}</span>
              </span>
              <span className="pl-6 text-xs text-mist">{option.description}</span>
            </label>
          ))}
        </div>
        {errors.platform ? (
          <p role="alert" className="mt-2 text-xs text-coral">
            {errors.platform.message}
          </p>
        ) : null}
      </fieldset>
      {platform === "otro" ? (
        <Field
          label="Nombre de tu fantasy"
          htmlFor="customPlatformName"
          error={errors.customPlatformName?.message}
        >
          <TextInput
            id="customPlatformName"
            {...register("customPlatformName")}
            aria-invalid={Boolean(errors.customPlatformName)}
            aria-describedby={
              errors.customPlatformName
                ? "customPlatformName-error"
                : undefined
            }
          />
        </Field>
      ) : null}
    </div>
  );
}

function StepLeague() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<AnalysisFormValues>();
  const strategy = watch("strategy");

  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl font-semibold text-lime">
        Contexto de la liga
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre de la liga (opcional)" htmlFor="leagueName">
          <TextInput id="leagueName" {...register("leagueName")} />
        </Field>
        <Field
          label="Participantes"
          htmlFor="participants"
          error={errors.participants?.message}
        >
          <TextInput
            id="participants"
            type="number"
            min={2}
            {...register("participants", { valueAsNumber: true })}
            aria-invalid={Boolean(errors.participants)}
          />
        </Field>
        <Field
          label="Tu posición actual"
          htmlFor="currentPosition"
          error={errors.currentPosition?.message}
        >
          <TextInput
            id="currentPosition"
            type="number"
            min={1}
            {...register("currentPosition", { valueAsNumber: true })}
          />
        </Field>
        <Field
          label="Jornada"
          htmlFor="matchday"
          error={errors.matchday?.message}
        >
          <TextInput
            id="matchday"
            type="number"
            min={1}
            {...register("matchday", { valueAsNumber: true })}
          />
        </Field>
      </div>
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-foam">
          Estrategia
        </legend>
        <div className="grid gap-3">
          {STRATEGY_OPTIONS.map((option) => (
            <label
              key={option.id}
              className={choiceClass(strategy === option.id)}
            >
              <input
                type="radio"
                value={option.id}
                {...register("strategy")}
                className="mt-1 accent-[var(--lime)]"
              />
              <span>
                <span className="block font-semibold text-ink">
                  {option.label}
                </span>
                <span className="text-xs text-mist">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function StepSquad() {
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = useFormContext<AnalysisFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "squad" });
  const watchedSquad = useWatch({ control, name: "squad" });
  const squad = useMemo(() => watchedSquad ?? [], [watchedSquad]);
  const maxPlayers = watch("maxPlayers");
  const totalValue = useMemo(
    () => squad.reduce((acc, p) => acc + (Number(p.value) || 0), 0),
    [squad],
  );
  const distribution = countByPosition(squad);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-lime">
            Plantilla
          </h2>
          <p className="text-sm text-mist">
            Añade tu equipo jugador a jugador. Los nombres deben ser únicos.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => append(createEmptySquadPlayer())}
        >
          Añadir jugador
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ProgressBar
          value={squad.length}
          max={maxPlayers || 18}
          label="Jugadores en plantilla"
        />
        <div className="rounded-md border border-[var(--line)] bg-pitch-950/40 px-3 py-2 text-sm">
          <p>
            Valor total aproximado:{" "}
            <strong className="text-lime">{formatMoney(totalValue)}</strong>
          </p>
          <p className="mt-1 text-xs text-mist">
            POR {distribution.portero} · DEF {distribution.defensa} · CEN{" "}
            {distribution.centrocampista} · DEL {distribution.delantero}
          </p>
        </div>
      </div>

      {squad.length > maxPlayers ? (
        <p role="alert" className="text-sm text-coral">
          Has superado el máximo permitido ({maxPlayers}). Deberás vender antes
          de fichar.
        </p>
      ) : null}
      {errors.squad?.message || errors.squad?.root?.message ? (
        <p role="alert" className="text-sm text-coral">
          {String(errors.squad?.message || errors.squad?.root?.message)}
        </p>
      ) : null}

      {fields.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--line)] bg-pitch-950/40 px-4 py-8 text-center">
          <p className="font-semibold text-ink">Tu plantilla está vacía</p>
          <p className="mt-1 text-sm text-mist">
            Añade al menos un jugador, o carga datos de ejemplo desde arriba
            para probar el flujo completo.
          </p>
          <Button
            type="button"
            className="mt-4"
            onClick={() => append(createEmptySquadPlayer())}
          >
            Añadir primer jugador
          </Button>
        </div>
      ) : null}

      <ul className="space-y-4">
        {fields.map((field, index) => (
          <li
            key={field.id}
            className="rounded-lg border border-[var(--line)] bg-pitch-950/30 p-3"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-foam">
                Jugador {index + 1}
              </span>
              <Button
                type="button"
                variant="danger"
                className="px-2 py-1 text-xs"
                onClick={() => remove(index)}
                aria-label={`Eliminar jugador ${index + 1}`}
              >
                Eliminar
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Nombre"
                htmlFor={`squad.${index}.name`}
                error={errors.squad?.[index]?.name?.message}
              >
                <TextInput
                  id={`squad.${index}.name`}
                  {...register(`squad.${index}.name`)}
                />
              </Field>
              <Field label="Posición" htmlFor={`squad.${index}.position`}>
                <TextSelect
                  id={`squad.${index}.position`}
                  {...register(`squad.${index}.position`)}
                >
                  {POSITION_OPTIONS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </TextSelect>
              </Field>
              <Field
                label="Valor actual (€)"
                htmlFor={`squad.${index}.value`}
                error={errors.squad?.[index]?.value?.message}
              >
                <TextInput
                  id={`squad.${index}.value`}
                  type="number"
                  min={0}
                  {...register(`squad.${index}.value`, { valueAsNumber: true })}
                />
              </Field>
              <Field label="Estado" htmlFor={`squad.${index}.status`}>
                <TextSelect
                  id={`squad.${index}.status`}
                  {...register(`squad.${index}.status`)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </TextSelect>
              </Field>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Controller
                control={control}
                name={`squad.${index}.extraPositions`}
                render={({ field: extraField }) => (
                  <fieldset>
                    <legend className="mb-2 text-sm font-medium text-foam">
                      Posiciones adicionales
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {POSITION_OPTIONS.map((pos) => {
                        const checked =
                          extraField.value?.includes(pos.id) ?? false;
                        return (
                          <label
                            key={pos.id}
                            className="inline-flex items-center gap-1.5 text-xs text-mist"
                          >
                            <input
                              type="checkbox"
                              className="accent-[var(--lime)]"
                              checked={checked}
                              onChange={(e) => {
                                const next = new Set(extraField.value ?? []);
                                if (e.target.checked) next.add(pos.id);
                                else next.delete(pos.id);
                                extraField.onChange([...next]);
                              }}
                            />
                            {pos.short}
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                )}
              />
              <div className="flex flex-col gap-2 pt-1">
                <label className="inline-flex items-center gap-2 text-sm text-foam">
                  <input
                    type="checkbox"
                    className="accent-[var(--lime)]"
                    {...register(`squad.${index}.usualStarter`)}
                  />
                  Titular habitual
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-foam">
                  <input
                    type="checkbox"
                    className="accent-[var(--lime)]"
                    {...register(`squad.${index}.doNotSell`)}
                  />
                  No deseo vender
                </label>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepBudget() {
  const {
    control,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<AnalysisFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "market" });
  const maxPlayers = watch("maxPlayers");

  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl font-semibold text-lime">
        Presupuesto y mercado
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Saldo disponible (€)"
          htmlFor="balance"
          error={errors.balance?.message}
        >
          <TextInput
            id="balance"
            type="number"
            {...register("balance", { valueAsNumber: true })}
          />
        </Field>
        <Field
          label="Máximo de jugadores"
          htmlFor="maxPlayers"
          error={errors.maxPlayers?.message}
        >
          <TextInput
            id="maxPlayers"
            type="number"
            min={11}
            {...register("maxPlayers", {
              valueAsNumber: true,
              onChange: (e) => {
                const value = Number(e.target.value);
                setValue("rules.maxPlayers", value, { shouldDirty: true });
              },
            })}
          />
        </Field>
      </div>
      <label className="inline-flex items-center gap-2 text-sm text-foam">
        <input
          type="checkbox"
          className="accent-[var(--lime)]"
          {...register("allowNegativeBalance")}
        />
        Saldo negativo permitido
      </label>
      <p className="text-xs text-mist">Máximo actual: {maxPlayers} jugadores.</p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink">Jugadores en el mercado</h3>
          <p className="mt-0.5 text-xs text-mist">
            Si no añades mercado, el plan se basa solo en tu plantilla y saldo.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => append(createEmptyMarketPlayer())}
        >
          Añadir al mercado
        </Button>
      </div>
      {errors.market?.message || errors.market?.root?.message ? (
        <p role="alert" className="text-sm text-coral">
          {String(errors.market?.message || errors.market?.root?.message)}
        </p>
      ) : null}

      {fields.length === 0 ? (
        <p className="rounded-md border border-dashed border-[var(--line)] bg-pitch-950/30 px-3 py-4 text-sm text-mist">
          Sin candidatos todavía. Añade jugadores que estés mirando para
          recibir pujas y fichajes prioritarios.
        </p>
      ) : null}

      <ul className="space-y-4">
        {fields.map((field, index) => (
          <li
            key={field.id}
            className="rounded-lg border border-[var(--line)] bg-pitch-950/30 p-3"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-foam">
                Candidato {index + 1}
              </span>
              <Button
                type="button"
                variant="danger"
                className="px-2 py-1 text-xs"
                onClick={() => remove(index)}
                aria-label={`Eliminar candidato ${index + 1}`}
              >
                Eliminar
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Nombre"
                htmlFor={`market.${index}.name`}
                error={errors.market?.[index]?.name?.message}
              >
                <TextInput
                  id={`market.${index}.name`}
                  {...register(`market.${index}.name`)}
                />
              </Field>
              <Field label="Posición" htmlFor={`market.${index}.position`}>
                <TextSelect
                  id={`market.${index}.position`}
                  {...register(`market.${index}.position`)}
                >
                  {POSITION_OPTIONS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </TextSelect>
              </Field>
              <Field
                label="Valor de mercado (€)"
                htmlFor={`market.${index}.marketValue`}
              >
                <TextInput
                  id={`market.${index}.marketValue`}
                  type="number"
                  min={0}
                  {...register(`market.${index}.marketValue`, {
                    valueAsNumber: true,
                  })}
                />
              </Field>
              <Field
                label="Precio mínimo (opcional)"
                htmlFor={`market.${index}.minPrice`}
              >
                <TextInput
                  id={`market.${index}.minPrice`}
                  type="number"
                  min={0}
                  {...register(`market.${index}.minPrice`, {
                    setValueAs: (v) =>
                      v === "" || v === null || Number.isNaN(Number(v))
                        ? undefined
                        : Number(v),
                  })}
                />
              </Field>
              <Field
                label="Puja estimada (opcional)"
                htmlFor={`market.${index}.estimatedBid`}
              >
                <TextInput
                  id={`market.${index}.estimatedBid`}
                  type="number"
                  min={0}
                  {...register(`market.${index}.estimatedBid`, {
                    setValueAs: (v) =>
                      v === "" || v === null || Number.isNaN(Number(v))
                        ? undefined
                        : Number(v),
                  })}
                />
              </Field>
              <Field label="Estado" htmlFor={`market.${index}.status`}>
                <TextSelect
                  id={`market.${index}.status`}
                  {...register(`market.${index}.status`)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </TextSelect>
              </Field>
            </div>
            <label className="mt-3 inline-flex items-center gap-2 text-sm text-foam">
              <input
                type="checkbox"
                className="accent-[var(--lime)]"
                {...register(`market.${index}.possibleStarter`)}
              />
              Posible titular
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepRules({ onLoadExample }: { onLoadExample: () => void }) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<AnalysisFormValues>();
  const maxPlayers = watch("maxPlayers");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-lime">
          Reglas de la liga
        </h2>
        <Button type="button" variant="secondary" onClick={onLoadExample}>
          Cargar liga de ejemplo
        </Button>
      </div>

      <p className="rounded-md border border-[var(--line)] bg-pitch-950/40 px-3 py-2 text-sm text-foam">
        Máximo de jugadores:{" "}
        <strong className="text-ink">{maxPlayers}</strong>
        <span className="mt-0.5 block text-xs text-mist">
          Se define en el paso Presupuesto para no duplicar el dato.
        </span>
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Dinero por punto (€)" htmlFor="moneyPerPoint">
          <TextInput
            id="moneyPerPoint"
            type="number"
            min={0}
            {...register("rules.moneyPerPoint", { valueAsNumber: true })}
          />
        </Field>
        <Field label="Premio MVP de partido (€)" htmlFor="matchMvpBonus">
          <TextInput
            id="matchMvpBonus"
            type="number"
            min={0}
            {...register("rules.matchMvpBonus", { valueAsNumber: true })}
          />
        </Field>
        <Field label="Premio MVP de jornada (€)" htmlFor="matchdayMvpBonus">
          <TextInput
            id="matchdayMvpBonus"
            type="number"
            min={0}
            {...register("rules.matchdayMvpBonus", { valueAsNumber: true })}
          />
        </Field>
        <Field label="Cambios durante la jornada" htmlFor="matchdayChanges">
          <TextInput
            id="matchdayChanges"
            type="number"
            min={0}
            {...register("rules.matchdayChanges", { valueAsNumber: true })}
          />
        </Field>
        <Field label="Multiplicador del capitán" htmlFor="captainMultiplier">
          <TextInput
            id="captainMultiplier"
            type="number"
            min={1}
            step={0.5}
            {...register("rules.captainMultiplier", { valueAsNumber: true })}
          />
        </Field>
        <Field label="Bonificación del ariete" htmlFor="strikerBonus">
          <TextInput
            id="strikerBonus"
            type="number"
            min={0}
            {...register("rules.strikerBonus", { valueAsNumber: true })}
          />
        </Field>
        <Field
          label="Bonificación máxima ariete/partido"
          htmlFor="strikerMaxBonusPerMatch"
        >
          <TextInput
            id="strikerMaxBonusPerMatch"
            type="number"
            min={0}
            {...register("rules.strikerMaxBonusPerMatch", {
              valueAsNumber: true,
            })}
          />
        </Field>
        <Field label="Máx. jornadas de cesión" htmlFor="maxLoanMatchdays">
          <TextInput
            id="maxLoanMatchdays"
            type="number"
            min={0}
            {...register("rules.maxLoanMatchdays", { valueAsNumber: true })}
          />
        </Field>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-foam">
          Opciones que afectan al plan
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["captainEnabled", "Capitán activado"],
              ["captainDoublesNegatives", "Capitán duplica también negativos"],
              ["strikerEnabled", "Ariete activado"],
              ["multifunctionalPlayers", "Jugadores multifunción"],
              ["clausesEnabled", "Cláusulas activadas"],
              ["clausesIrreversible", "Cláusulas irreversibles"],
              ["loansAllowed", "Cesiones permitidas"],
              ["salesBetweenParticipants", "Ventas entre participantes"],
              [
                "saleOnlyWhenOnMarket",
                "Venta solo si el jugador está en el mercado",
              ],
            ] as const
          ).map(([name, label]) => (
            <label
              key={name}
              className="inline-flex items-center gap-2 text-sm text-foam"
            >
              <input
                type="checkbox"
                className="accent-[var(--lime)]"
                {...register(`rules.${name}`)}
              />
              {label}
            </label>
          ))}
        </div>
        {errors.rules?.maxPlayers?.message ? (
          <p role="alert" className="mt-2 text-xs text-coral">
            {errors.rules.maxPlayers.message}
          </p>
        ) : null}
      </div>

      <Field label="Reglas adicionales" htmlFor="additionalRules">
        <TextArea
          id="additionalRules"
          {...register("rules.additionalRules")}
        />
      </Field>
      <Field label="Notas privadas de convivencia" htmlFor="privateNotes">
        <TextArea id="privateNotes" {...register("rules.privateNotes")} />
      </Field>
    </div>
  );
}

function StepAnalysisType() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<AnalysisFormValues>();
  const analysisType = watch("analysisType");

  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl font-semibold text-lime">
        Tipo de análisis
      </h2>
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-foam">
          ¿Qué quieres priorizar?
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {ANALYSIS_TYPE_OPTIONS.map((option) => (
            <label
              key={option.id}
              className={choiceClass(analysisType === option.id)}
            >
              <input
                type="radio"
                value={option.id}
                {...register("analysisType")}
                className="mt-1 accent-[var(--lime)]"
              />
              <span>
                <span className="block font-semibold text-ink">
                  {option.label}
                </span>
                <span className="text-xs text-mist">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
        {errors.analysisType ? (
          <p role="alert" className="mt-2 text-xs text-coral">
            {errors.analysisType.message}
          </p>
        ) : null}
      </fieldset>
      <Field
        label="¿Qué duda concreta tienes?"
        htmlFor="concreteDoubt"
        hint='Ejemplo: "Solo puedo fichar a uno. ¿A quién compro y qué debería vender?"'
      >
        <TextArea id="concreteDoubt" {...register("concreteDoubt")} />
      </Field>
      <p className="text-xs leading-relaxed text-mist">
        El plan marcará cada recomendación como{" "}
        <span className="text-safe">segura</span>,{" "}
        <span className="text-balanced">equilibrada</span> o{" "}
        <span className="text-risky">arriesgada</span> según tu estrategia y
        reglas.
      </p>
    </div>
  );
}
