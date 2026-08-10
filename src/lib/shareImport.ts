/** Texto pendiente recibido vía Web Share Target (solo sessionStorage). */

export const PENDING_SHARE_KEY = "pujazo.pendingShareText.v1";

export type ShareImportKind = "squad" | "market";

export function savePendingShareText(text: string): void {
  if (typeof window === "undefined") return;
  const trimmed = text.trim();
  if (!trimmed) return;
  try {
    sessionStorage.setItem(PENDING_SHARE_KEY, trimmed);
  } catch {
    // quota / private mode
  }
}

export function peekPendingShareText(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(PENDING_SHARE_KEY);
  } catch {
    return null;
  }
}

export function takePendingShareText(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = sessionStorage.getItem(PENDING_SHARE_KEY);
    if (!value) return null;
    sessionStorage.removeItem(PENDING_SHARE_KEY);
    return value;
  } catch {
    return null;
  }
}

/**
 * Heurística local: mercado vs plantilla a partir del texto compartido.
 */
export function guessShareImportKind(text: string): ShareImportKind {
  const t = text.toLowerCase();
  const marketHints =
    /\bel mercado de hoy\b/.test(t) ||
    (/\b#\s*biwenger\b/.test(t) && /\bmercado\b/.test(t)) ||
    /\bpujar\b/.test(t) ||
    /\blibre,\s*finaliza\b/.test(t);
  if (marketHints) return "market";

  const squadHints =
    /\bplantilla\b/.test(t) ||
    /\bvender\b/.test(t) ||
    /\bporteros\b/.test(t) ||
    /\bdefensas\b/.test(t) ||
    /\bcentrocampistas\b/.test(t) ||
    /\bdelanteros\b/.test(t);
  if (squadHints) return "squad";

  // Share corto solo con nombres → suele ser mercado “Compartir”
  if (/\b#\s*biwenger\b/.test(t) && t.includes(",")) return "market";
  return "squad";
}

/** Consume el share solo si coincide con el paso (plantilla/mercado). */
export function takePendingShareTextFor(
  expected: ShareImportKind,
): string | null {
  const peeked = peekPendingShareText();
  if (!peeked) return null;
  const kind = guessShareImportKind(peeked);
  if (kind !== expected) return null;
  return takePendingShareText();
}
