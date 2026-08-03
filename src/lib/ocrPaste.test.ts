import { describe, expect, it } from "vitest";
import { parsePastedPlayers } from "@/lib/importPaste";

describe("flujo OCR → parser", () => {
  it("acepta texto ruidoso típico de OCR de plantilla Biwenger", () => {
    // Simula saltos/espacios imperfectos que suele devolver Tesseract
    const ocrLike = `
Plantilla
Batalla
PT
0
Batalla
3.650.000 €
Vender
Lookman
DL
0
Lookman
7.960.000 €
Vender
-39.100 €
Saldo
`.replace(/ €/g, " €");

    const result = parsePastedPlayers(ocrLike);
    expect(result.players.map((p) => p.name)).toEqual(
      expect.arrayContaining(["Batalla", "Lookman"]),
    );
    expect(result.meta.balance).toBe(-39_100);
  });
});
