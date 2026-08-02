"use client";

import { useSyncExternalStore } from "react";
import { PageShell } from "@/components/layout/SiteChrome";
import {
  ResultEmptyState,
  ResultPlan,
} from "@/components/resultado/ResultPlan";
import type { AnalysisResult } from "@/lib/types";
import { STORAGE_KEYS } from "@/lib/constants";
import { loadLastAnalysis } from "@/lib/storage";

let cachedRaw: string | null | undefined;
let cachedResult: AnalysisResult | null = null;

function subscribe(onStoreChange: () => void) {
  const handler = (event: StorageEvent) => {
    if (event.key === STORAGE_KEYS.lastAnalysis || event.key === null) {
      cachedRaw = undefined;
      onStoreChange();
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function getClientAnalysis(): AnalysisResult | null {
  const raw = localStorage.getItem(STORAGE_KEYS.lastAnalysis);
  if (raw === cachedRaw) return cachedResult;
  cachedRaw = raw;
  cachedResult = loadLastAnalysis()?.result ?? null;
  return cachedResult;
}

function getServerAnalysis(): AnalysisResult | null {
  return null;
}

export default function ResultadoPage() {
  const result = useSyncExternalStore(
    subscribe,
    getClientAnalysis,
    getServerAnalysis,
  );

  return (
    <PageShell compactHeader>
      {result ? <ResultPlan result={result} /> : <ResultEmptyState />}
    </PageShell>
  );
}
