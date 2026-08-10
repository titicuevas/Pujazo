"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  PLATFORM_OPTIONS,
  PLATFORM_RULE_PRESETS,
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
import {
  analysisFormSchema,
  normalizeName,
  type AnalysisFormValues,
} from "@/lib/schemas";
import { countByPosition } from "@/lib/analysis";
import type { ParsedPastePlayer, PasteMeta } from "@/lib/importPaste";
import {
  clearAllLocalData,
  loadCustomRules,
  loadFormDraft,
  saveCustomRules,
  saveFormDraft,
  saveLastAnalysis,
  storageWriteMessage,
} from "@/lib/storage";
import {
  guessShareImportKind,
  peekPendingShareText,
} from "@/lib/shareImport";
import { analyzeTeam } from "@/lib/analysis";
import {
  copyText,
  downloadTextFile,
  leagueRulesToPlainText,
} from "@/lib/export";
import {
  Button,
  Field,
  Panel,
  ProgressBar,
  TextArea,
  TextInput,
  TextSelect,
} from "@/components/ui/Primitives";
import { PasteImportPanel } from "@/components/analyzer/PasteImportPanel";

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

const STEP_FIELDS: (keyof AnalysisFormValues | `rules.${string}`)[][] = [
  ["platform", "customPlatformName"],
  ["leagueName", "participants", "currentPosition", "matchday", "strategy"],
  ["squad"],
  ["balance", "maxPlayers", "allowNegativeBalance", "market"],
  ["rules"],
  ["analysisType", "concreteDoubt"],
];

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

export function AnalyzerWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startPaste = searchParams.get("pegar") === "1";
  const startShare = searchParams.get("share") === "1";
  const fromHistory = searchParams.get("desde") === "historial";
  const nextMatchday = searchParams.get("jornada") === "1";
  const [step, setStep] = useState(
    nextMatchday ? 3 : startPaste || startShare ? 2 : 0,
  );
  const [ready, setReady] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const hydratedRef = useRef(false);

  useLayoutEffect(() => {
    if (startShare) {
      const pending = peekPendingShareText();
      if (pending && guessShareImportKind(pending) === "market") {
        setStep(3);
      } else {
        setStep(2);
      }
      return;
    }
    if (nextMatchday) setStep(3);
  }, [startShare, nextMatchday]);

  const methods = useForm<AnalysisFormValues>({
    resolver: zodResolver(analysisFormSchema) as never,
    defaultValues: createDefaultFormValues(),
    mode: "onBlur",
  });

  const { handleSubmit, reset, setValue, trigger, getValues, control } =
    methods;

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
          nextMatchday
            ? "Siguiente jornada: plantilla y reglas listas. Actualiza saldo y pega el mercado nuevo."
            : fromHistory
              ? "Plan del historial cargado en el asistente. Ajusta y vuelve a generar."
              : startPaste
                ? "Borrador recuperado. Pega tu plantilla abajo o sigue editando."
                : "Se ha recuperado el último borrador guardado en este dispositivo.",
        );
      } else if (rules) {
        setValue("rules", rules);
        if (startPaste) {
          setBanner(
            "Empieza pegando tu plantilla: usa la guía de importación de abajo.",
          );
        }
      } else if (startPaste) {
        setBanner(
          "Empieza pegando tu plantilla: usa la guía de importación de abajo.",
        );
      }
      setReady(true);
    });
  }, [reset, setValue, startPaste, fromHistory, nextMatchday]);

  const draftValues = useWatch({ control });

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      saveFormDraft(getValues());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [draftValues, ready, getValues]);

  async function nextStep() {
    const fields = STEP_FIELDS[step];
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
      const ok = await trigger(STEP_FIELDS[i] as never);
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
    const platform = getValues("platform") || "biwenger";
    const demo = createDemoFormValues(platform);
    const presetLabel =
      PLATFORM_RULE_PRESETS.find((p) => p.id === platform)?.label ?? platform;
    reset(demo);
    setBanner(
      `Datos de ejemplo (${presetLabel}) cargados. Revisa los pasos y genera el análisis.`,
    );
    setStep(0);
  }

  function applyRulePreset(presetId: string) {
    const preset = PLATFORM_RULE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    if (
      !window.confirm(
        `¿Cargar el preset “${preset.label}”? Se sustituirán las reglas actuales de este borrador.`,
      )
    ) {
      return;
    }
    setValue("rules", { ...preset.rules }, { shouldDirty: true });
    setValue("maxPlayers", preset.rules.maxPlayers, { shouldDirty: true });
    saveCustomRules(preset.rules);
    setBanner(`Preset de reglas “${preset.label}” cargado. Ajústalo si tu liga es distinta.`);
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
      const needsMarket =
        values.analysisType === "mercado" ||
        values.analysisType === "comparar" ||
        values.analysisType === "completo";
      if (needsMarket && values.market.length === 0) {
        const goOn = window.confirm(
          "No hay jugadores en el mercado. El plan no podrá recomendar fichajes ni pujas. ¿Generar igual?",
        );
        if (!goOn) {
          setBanner(
            "Pega o añade el mercado, o cambia el tipo de análisis a alineación/ventas.",
          );
          setStep(3);
          return;
        }
      }
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
      const saved = saveLastAnalysis(result, synced);
      saveCustomRules(synced.rules);
      saveFormDraft(synced);
      if (!saved.ok) {
        setBanner(
          storageWriteMessage(saved) ??
            "No se pudo guardar el plan en este dispositivo.",
        );
        return;
      }
      const notice = storageWriteMessage(saved);
      if (notice) {
        try {
          sessionStorage.setItem("pujazo.postSaveNotice", notice);
        } catch {
          // ignore
        }
      }
      router.push("/resultado");
    },
    async () => {
      for (let i = 0; i < STEP_FIELDS.length; i++) {
        const ok = await trigger(STEP_FIELDS[i] as never);
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
        Calentando en el vestuario…
      </p>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
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
        <p className="mb-6 text-xs text-mist">
          La demo usa la plataforma seleccionada (Biwenger, Comunio, LALIGA
          FANTASY u otra) y carga plantilla, mercado y reglas de ejemplo.
        </p>

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
              <StepRules onLoadPreset={applyRulePreset} />
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
    setValue,
    formState: { errors },
  } = useFormContext<AnalysisFormValues>();
  const strategy = watch("strategy");
  const participants = watch("participants") || 10;
  const currentPosition = watch("currentPosition") || 1;

  const participantOptions = Array.from({ length: 19 }, (_, i) => i + 2); // 2..20
  const positionOptions = Array.from(
    { length: Math.max(2, participants) },
    (_, i) => i + 1,
  );
  const matchdayOptions = Array.from({ length: 38 }, (_, i) => i + 1);

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
          <TextSelect
            id="participants"
            {...register("participants", {
              valueAsNumber: true,
              onChange: (event) => {
                const next = Number(event.target.value);
                if (currentPosition > next) {
                  setValue("currentPosition", next, { shouldDirty: true });
                }
              },
            })}
            aria-invalid={Boolean(errors.participants)}
          >
            {participantOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </TextSelect>
        </Field>
        <Field
          label="Tu posición actual"
          htmlFor="currentPosition"
          error={errors.currentPosition?.message}
        >
          <TextSelect
            id="currentPosition"
            {...register("currentPosition", { valueAsNumber: true })}
          >
            {positionOptions.map((n) => (
              <option key={n} value={n}>
                {n}º
              </option>
            ))}
          </TextSelect>
        </Field>
        <Field
          label="Jornada"
          htmlFor="matchday"
          error={errors.matchday?.message}
        >
          <TextSelect
            id="matchday"
            {...register("matchday", { valueAsNumber: true })}
          >
            {matchdayOptions.map((n) => (
              <option key={n} value={n}>
                Jornada {n}
              </option>
            ))}
          </TextSelect>
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
  const searchParams = useSearchParams();
  const autoClipboardOnMount = searchParams.get("clip") === "1";
  const autoShareOnMount = searchParams.get("share") === "1";
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<AnalysisFormValues>();
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "squad",
  });
  const watchedSquad = useWatch({ control, name: "squad" });
  const squad = useMemo(() => watchedSquad ?? [], [watchedSquad]);
  const maxPlayers = watch("maxPlayers");
  const platform = watch("platform");
  const totalValue = useMemo(
    () => squad.reduce((acc, p) => acc + (Number(p.value) || 0), 0),
    [squad],
  );
  const distribution = countByPosition(squad);

  function importSquadPlayers(
    players: ParsedPastePlayer[],
    mode: "replace" | "append",
    meta: PasteMeta,
  ) {
    const mapped = players.map((p) => ({
      ...createEmptySquadPlayer(),
      name: p.name,
      position: p.position ?? "centrocampista",
      value: p.value ?? 0,
      extraPositions: (p.extraPositions ?? []).filter(
        (pos) => pos !== (p.position ?? "centrocampista"),
      ),
    }));
    if (mode === "replace") {
      replace(mapped);
    } else {
      const existing = new Set(squad.map((p) => normalizeName(p.name)));
      for (const player of mapped) {
        if (existing.has(normalizeName(player.name))) continue;
        append(player);
        existing.add(normalizeName(player.name));
      }
    }
    if (meta.balance !== undefined) {
      setValue("balance", meta.balance, { shouldDirty: true });
      if (meta.balance < 0) {
        setValue("allowNegativeBalance", true, { shouldDirty: true });
      }
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-lime">
            Plantilla
          </h2>
          <p className="text-sm text-mist">
            En móvil o PC: pega tu plantilla con la guía de abajo, o añade
            jugadores a mano. Los nombres deben ser únicos.
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

      <PasteImportPanel
        kind="squad"
        platform={platform}
        defaultOpen
        autoClipboardOnMount={autoClipboardOnMount}
        autoShareOnMount={autoShareOnMount}
        onImport={importSquadPlayers}
      />

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
            Usa la guía de pegado arriba (móvil o PC), añade jugadores a mano, o
            carga datos de ejemplo desde la cabecera.
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
  const searchParams = useSearchParams();
  const autoShareOnMount = searchParams.get("share") === "1";
  const {
    control,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<AnalysisFormValues>();
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "market",
  });
  const maxPlayers = watch("maxPlayers");
  const platform = watch("platform");
  const watchedMarket = useWatch({ control, name: "market" });
  const market = useMemo(() => watchedMarket ?? [], [watchedMarket]);

  function importMarketPlayers(
    players: ParsedPastePlayer[],
    mode: "replace" | "append",
    meta: PasteMeta,
  ) {
    const mapped = players.map((p) => ({
      ...createEmptyMarketPlayer(),
      name: p.name,
      position: p.position ?? "centrocampista",
      marketValue: p.value ?? 0,
      minPrice: p.clausePrice,
    }));
    if (mode === "replace") {
      replace(mapped);
    } else {
      const existing = new Set(market.map((p) => normalizeName(p.name)));
      for (const player of mapped) {
        if (existing.has(normalizeName(player.name))) continue;
        append(player);
        existing.add(normalizeName(player.name));
      }
    }
    if (meta.balance !== undefined) {
      setValue("balance", meta.balance, { shouldDirty: true });
      if (meta.balance < 0) {
        setValue("allowNegativeBalance", true, { shouldDirty: true });
      }
    }
  }

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

      <PasteImportPanel
        kind="market"
        platform={platform}
        defaultOpen
        autoShareOnMount={autoShareOnMount}
        onImport={importMarketPlayers}
      />

      {errors.market?.message || errors.market?.root?.message ? (
        <p role="alert" className="text-sm text-coral">
          {String(errors.market?.message || errors.market?.root?.message)}
        </p>
      ) : null}

      {fields.length === 0 ? (
        <p className="rounded-md border border-dashed border-[var(--line)] bg-pitch-950/30 px-3 py-4 text-sm text-mist">
          Sin candidatos todavía. Pega el mercado (mejor desde el navegador) o
          añade a mano 3–5 jugadores que estés mirando: con eso Pujazo ya te da
          un top de fichajes y pujas.
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

function StepRules({
  onLoadPreset,
}: {
  onLoadPreset: (presetId: string) => void;
}) {
  const {
    register,
    watch,
    getValues,
    formState: { errors },
  } = useFormContext<AnalysisFormValues>();
  const maxPlayers = watch("maxPlayers");
  const platform = watch("platform");
  const [rulesStatus, setRulesStatus] = useState<string | null>(null);

  async function copyCurrentRules() {
    const values = getValues();
    const platformLabel =
      PLATFORM_OPTIONS.find((p) => p.id === values.platform)?.label ??
      values.platform;
    const text = leagueRulesToPlainText(
      { ...values.rules, maxPlayers: values.maxPlayers || values.rules.maxPlayers },
      {
        platformLabel,
        leagueName: values.leagueName,
      },
    );
    const ok = await copyText(text);
    setRulesStatus(
      ok
        ? "Reglas copiadas al portapapeles. Puedes pegarlas en un chat o documento."
        : "No se pudo copiar. Prueba «Descargar reglas» o selecciona el texto a mano.",
    );
  }

  function downloadCurrentRules() {
    const values = getValues();
    const platformLabel =
      PLATFORM_OPTIONS.find((p) => p.id === values.platform)?.label ??
      values.platform;
    const text = leagueRulesToPlainText(
      { ...values.rules, maxPlayers: values.maxPlayers || values.rules.maxPlayers },
      {
        platformLabel,
        leagueName: values.leagueName,
      },
    );
    const slug = (values.leagueName || platformLabel || "liga")
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúñ]+/gi, "-")
      .replace(/^-|-$/g, "");
    downloadTextFile(`pujazo-reglas-${slug || "liga"}.txt`, text);
    setRulesStatus("Archivo de reglas descargado.");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-lime">
            Reglas de la liga
          </h2>
          <p className="mt-1 text-sm text-mist">
            Empieza con un preset de plataforma y ajústalo a tu comunidad.
            Luego puedes copiarlas para compartirlas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => void copyCurrentRules()}>
            Copiar reglas
          </Button>
          <Button type="button" variant="ghost" onClick={downloadCurrentRules}>
            Descargar .txt
          </Button>
        </div>
      </div>

      {rulesStatus ? (
        <p
          role="status"
          className="rounded-md border border-lime/30 bg-lime/10 px-3 py-2 text-sm text-foam"
        >
          {rulesStatus}
        </p>
      ) : null}

      <div className="rounded-lg border border-[var(--line)] bg-pitch-950/40 p-3">
        <p className="text-sm font-semibold text-ink">Presets por plataforma</p>
        <p className="mt-1 text-xs text-mist">
          Son orientativos (no oficiales). El de tu plataforma actual aparece
          primero.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ...PLATFORM_RULE_PRESETS.filter((p) => p.id === platform),
            ...PLATFORM_RULE_PRESETS.filter((p) => p.id !== platform),
          ].map((preset) => (
            <Button
              key={preset.id}
              type="button"
              variant={preset.id === platform ? "secondary" : "ghost"}
              className="text-left"
              onClick={() => onLoadPreset(preset.id)}
              title={preset.description}
            >
              {preset.label}
            </Button>
          ))}
        </div>
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
          <TextSelect
            id="matchdayChanges"
            {...register("rules.matchdayChanges", { valueAsNumber: true })}
          >
            {Array.from({ length: 12 }, (_, i) => i).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </TextSelect>
        </Field>
        <Field label="Multiplicador del capitán" htmlFor="captainMultiplier">
          <TextSelect
            id="captainMultiplier"
            {...register("rules.captainMultiplier", { valueAsNumber: true })}
          >
            {[1, 1.5, 2, 2.5, 3].map((n) => (
              <option key={n} value={n}>
                ×{n}
              </option>
            ))}
          </TextSelect>
        </Field>
        <Field label="Bonificación del ariete" htmlFor="strikerBonus">
          <TextSelect
            id="strikerBonus"
            {...register("rules.strikerBonus", { valueAsNumber: true })}
          >
            {Array.from({ length: 11 }, (_, i) => i).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </TextSelect>
        </Field>
        <Field
          label="Bonificación máxima ariete/partido"
          htmlFor="strikerMaxBonusPerMatch"
        >
          <TextSelect
            id="strikerMaxBonusPerMatch"
            {...register("rules.strikerMaxBonusPerMatch", {
              valueAsNumber: true,
            })}
          >
            {Array.from({ length: 11 }, (_, i) => i).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </TextSelect>
        </Field>
        <Field label="Máx. jornadas de cesión" htmlFor="maxLoanMatchdays">
          <TextSelect
            id="maxLoanMatchdays"
            {...register("rules.maxLoanMatchdays", { valueAsNumber: true })}
          >
            {Array.from({ length: 11 }, (_, i) => i).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </TextSelect>
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
