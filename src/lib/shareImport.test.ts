import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  PENDING_SHARE_KEY,
  savePendingShareText,
  takePendingShareText,
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
});
