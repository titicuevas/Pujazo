/** Texto pendiente recibido vía Web Share Target (solo sessionStorage). */

export const PENDING_SHARE_KEY = "pujazo.pendingShareText.v1";

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
