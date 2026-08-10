import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  PENDING_SHARE_KEY,
  guessShareImportKind,
  savePendingShareText,
  takePendingShareText,
  takePendingShareTextFor,
} from "@/lib/shareImport";

describe("shareImport", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });
  afterEach(() => {
    sessionStorage.clear();
  });

  it("guarda y consume el texto pendiente una sola vez", () => {
    savePendingShareText("  #Biwenger: Oblak, Lookman  ");
    expect(sessionStorage.getItem(PENDING_SHARE_KEY)).toContain("Oblak");
    expect(takePendingShareText()).toBe("#Biwenger: Oblak, Lookman");
    expect(takePendingShareText()).toBeNull();
  });

  it("ignora vacío", () => {
    savePendingShareText("   ");
    expect(sessionStorage.getItem(PENDING_SHARE_KEY)).toBeNull();
  });

  it("detecta mercado vs plantilla", () => {
    expect(
      guessShareImportKind("El mercado de hoy en mi liga #Biwenger: A, B, C"),
    ).toBe("market");
    expect(
      guessShareImportKind("Plantilla\nPORTEROS\nOblak\nVender\n4.000.000 €"),
    ).toBe("squad");
  });

  it("solo consume el share del kind esperado", () => {
    savePendingShareText("El mercado de hoy #Biwenger: De Frutos, Pépé");
    expect(takePendingShareTextFor("squad")).toBeNull();
    expect(takePendingShareTextFor("market")).toMatch(/De Frutos/);
  });
});
