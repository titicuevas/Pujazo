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

  it("parsea tarjetas reales de plantilla Biwenger", () => {
    const raw = `
Alineación
Aitor Fernández
Huijsen
Lookman
Plantilla
Aitor Fernández
PT
0
Aitor Fernández
200.000 €
Vender
Huijsen
DF
0
Huijsen
4.290.000 €
30.000 €
Vender
Oso
DF
/
MC
0
Oso
2.170.000 €
40.000 €
Vender
Lookman
DL
/
MC
0
Lookman
7.850.000 €
110.000 €
Vender
`;
    const result = parsePastedPlayers(raw);
    expect(result.players.map((p) => p.name)).toEqual([
      "Aitor Fernández",
      "Huijsen",
      "Oso",
      "Lookman",
    ]);
    expect(result.players[0]).toMatchObject({
      position: "portero",
      value: 200_000,
    });
    expect(result.players[1]).toMatchObject({
      position: "defensa",
      value: 4_290_000,
    });
    expect(result.players[2]).toMatchObject({
      name: "Oso",
      position: "defensa",
      value: 2_170_000,
      extraPositions: ["centrocampista"],
    });
    expect(result.players[3]).toMatchObject({
      position: "delantero",
      value: 7_850_000,
      extraPositions: ["centrocampista"],
    });
  });

  it("parsea mercado Biwenger y corta el catálogo global", () => {
    const raw = `
Mercado
Aimar Oroz
 Funesbuque, finaliza en 2 días
MC
/
DL
0
Aimar Oroz
3.650.000 €
30.000 €
4.562.500 €
Joan García
Libre, finaliza en 8 horas
PT
0
Joan García
10.340.000 €
90.000 €
Pujar
Bernardo Silva
Libre, finaliza en 8 horas
MC
0
Bernardo Silva
9.300.000 €
20.000 €
Pujar
Evolución del mercado
Yamal
DL
Yamal
21.050.000 €
Todos los jugadores
Mbappé
DL
Mbappé
25.260.000 €
`;
    const result = parsePastedPlayers(raw);
    expect(result.players.map((p) => p.name)).toEqual([
      "Aimar Oroz",
      "Joan García",
      "Bernardo Silva",
    ]);
    expect(result.players[0]).toMatchObject({
      position: "centrocampista",
      value: 3_650_000,
      clausePrice: 4_562_500,
      extraPositions: ["delantero"],
    });
    expect(result.players[1]).toMatchObject({
      position: "portero",
      value: 10_340_000,
    });
    expect(result.players.some((p) => p.name === "Mbappé")).toBe(false);
    expect(result.players.some((p) => p.name === "Yamal")).toBe(false);
  });

  it("detecta el saldo etiquetado en pegados Biwenger", () => {
    const raw = `
Plantilla
Aitor Fernández
PT
0
Aitor Fernández
200.000 €
Vender
3,8M €
Saldo
`;
    const result = parsePastedPlayers(raw);
    expect(result.meta.balance).toBe(3_800_000);
    expect(result.players[0]?.name).toBe("Aitor Fernández");
  });

  it("parsea plantilla estilo Comunio (POR/DEF/MED/DEL + club + valor)", () => {
    const raw = `
Mis jugadores
Courtois
POR
Real Madrid
12500000
Carvajal
DEF
Real Madrid
8.200.000
Bellingham
MED
Real Madrid
18.500.000
Morata
DEL
Atlético
9.100.000
Dinero
2.450.000
`;
    const result = parsePastedPlayers(raw);
    expect(result.players).toHaveLength(4);
    expect(result.players[0]).toMatchObject({
      name: "Courtois",
      position: "portero",
      value: 12_500_000,
    });
    expect(result.players[1]).toMatchObject({
      name: "Carvajal",
      position: "defensa",
      value: 8_200_000,
    });
    expect(result.players[2].position).toBe("centrocampista");
    expect(result.players[3]).toMatchObject({
      name: "Morata",
      position: "delantero",
      value: 9_100_000,
    });
    expect(result.meta.balance).toBe(2_450_000);
  });

  it("parsea fichas estilo LALIGA FANTASY con Valor y Cláusula", () => {
    const raw = `
Mi plantilla
Unai Simón
Portero
Athletic Club
Valor
4.200.000 €
Cláusula
12.000.000 €
Nico Williams
Delantero
Athletic Club
Valor 15.800.000 €
Cláusula: 40.000.000 €
`;
    const result = parsePastedPlayers(raw);
    expect(result.players.map((p) => p.name)).toEqual([
      "Unai Simón",
      "Nico Williams",
    ]);
    expect(result.players[0]).toMatchObject({
      position: "portero",
      value: 4_200_000,
      clausePrice: 12_000_000,
    });
    expect(result.players[1]).toMatchObject({
      position: "delantero",
      value: 15_800_000,
      clausePrice: 40_000_000,
    });
  });

  it("parsea filas tabuladas Comunio/LF", () => {
    const raw = `
Courtois\tPOR\t12.500.000
Carvajal\tDEF\t8200000
`;
    const result = parsePastedPlayers(raw);
    expect(result.players).toHaveLength(2);
    expect(result.players[0]).toMatchObject({
      name: "Courtois",
      position: "portero",
      value: 12_500_000,
    });
    expect(result.players[1].value).toBe(8_200_000);
  });
});
