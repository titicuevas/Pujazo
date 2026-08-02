import { describe, expect, it } from "vitest";
import { parsePastedPlayers } from "@/lib/importPaste";

describe("parsePastedPlayers", () => {
  it("extrae nombres, posiciones y valores europeos", () => {
    const raw = `
Plantilla
K. Rivas POR 4.500.000
Y. Cordero · Delantero · 9.450.000 €
H. Ballester
`;
    const result = parsePastedPlayers(raw);
    expect(result.players).toHaveLength(3);
    expect(result.players[0]).toMatchObject({
      name: "K. Rivas",
      position: "portero",
      value: 4_500_000,
    });
    expect(result.players[1]).toMatchObject({
      name: "Y. Cordero",
      position: "delantero",
      value: 9_450_000,
    });
    expect(result.players[2].name).toBe("H. Ballester");
    expect(result.players[2].value).toBeUndefined();
  });

  it("acepta listas separadas por comas", () => {
    const result = parsePastedPlayers("Ana Ruiz, Luis Peña, M. Ordóñez");
    expect(result.players.map((p) => p.name)).toEqual([
      "Ana Ruiz",
      "Luis Peña",
      "M. Ordóñez",
    ]);
  });

  it("entiende millones abreviados", () => {
    const result = parsePastedPlayers("C. Aranda MED 12.5M");
    expect(result.players[0]).toMatchObject({
      name: "C. Aranda",
      position: "centrocampista",
      value: 12_500_000,
    });
  });

  it("deduplica por nombre normalizado", () => {
    const result = parsePastedPlayers("K. Rivas\nk.  rivas\nK. Rivas POR");
    expect(result.players).toHaveLength(1);
  });

  it("avisa si no hay jugadores", () => {
    const result = parsePastedPlayers("Plantilla\nMercado\n");
    expect(result.players).toHaveLength(0);
    expect(result.warnings[0]).toMatch(/No se detectaron/);
  });
});
