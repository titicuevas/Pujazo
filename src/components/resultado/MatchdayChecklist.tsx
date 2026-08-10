"use client";

import { useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/ui/Primitives";
import {
  buildMatchdayActions,
  loadMatchdayChecklist,
  toggleMatchdayAction,
} from "@/lib/actionChecklist";
import type { AnalysisResult } from "@/lib/types";

export function MatchdayChecklist({ result }: { result: AnalysisResult }) {
  const actions = useMemo(() => buildMatchdayActions(result), [result]);
  const analysisId = result.generatedAt;
  const [done, setDone] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    queueMicrotask(() => {
      setDone(loadMatchdayChecklist(analysisId));
    });
  }, [analysisId]);

  if (actions.length === 0) return null;

  const completed = actions.filter((a) => done.has(a.id)).length;

  return (
    <div id="acciones" className="scroll-mt-20">
      <Panel className="border-lime/35 bg-lime/5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-semibold text-lime">
            Acciones de la jornada
          </h2>
          <p className="mt-1 text-sm text-mist">
            Márcalas cuando las hagas en tu fantasy. Se guardan solo en este
            dispositivo.
          </p>
        </div>
        <p className="text-sm font-semibold text-ink">
          {completed}/{actions.length}
        </p>
      </div>

      <ul className="mt-4 space-y-2">
        {actions.map((action) => {
          const checked = done.has(action.id);
          return (
            <li key={action.id}>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                  checked
                    ? "border-lime/40 bg-lime/10 text-mist line-through"
                    : "border-[var(--line)] bg-pitch-950/40 text-foam"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 accent-[var(--lime)]"
                  checked={checked}
                  onChange={() => {
                    setDone(toggleMatchdayAction(analysisId, action.id));
                  }}
                />
                <span className={checked ? "" : "text-ink"}>{action.label}</span>
              </label>
            </li>
          );
        })}
      </ul>
      </Panel>
    </div>
  );
}
