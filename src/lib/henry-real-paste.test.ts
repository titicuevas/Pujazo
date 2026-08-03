import { describe, expect, it } from "vitest";
import { parsePastedPlayers } from "@/lib/importPaste";
import { createDemoFormValues } from "@/lib/demo";
import { analyzeTeam } from "@/lib/analysis";
import { createId } from "@/lib/format";
import type { AnalysisFormValues } from "@/lib/schemas";

const PLANTILLA = `
Henry
CHACHOS F.C
6º
Posición
0
Puntos
-39.100 €
Saldo
PlantillaNoticias
Batalla
PT
0
Batalla
3.650.000 €
40.000 €
Vender
Aitor Fernández
PT
0
Aitor Fernández
200.000 €
Vender
Germán Parreño
En venta por 150.000 €
 2 días
PT
0
Germán Parreño
150.000 €
En venta
Huijsen
DF
0
Huijsen
4.320.000 €
30.000 €
Vender
Oso
DF
/
MC
0
Oso
2.220.000 €
50.000 €
Vender
Quagliata
DF
0
Quagliata
1.840.000 €
50.000 €
Vender
Manu Sánchez
DF
0
Manu Sánchez
1.350.000 €
30.000 €
Vender
Unai Núñez
DF
0
Unai Núñez
730.000 €
10.000 €
Vender
Kang-in Lee
MC
0
Kang-in Lee
4.810.000 €
120.000 €
Vender
Barrenetxea
MC
/
DL
0
Barrenetxea
3.950.000 €
50.000 €
Vender
Jauregizar
MC
0
Jauregizar
3.360.000 €
30.000 €
Vender
Koke
MC
0
Koke
2.640.000 €
50.000 €
Vender
Lookman
DL
/
MC
0
Lookman
7.960.000 €
110.000 €
Vender
Ayoze
DL
0
Ayoze
3.950.000 €
50.000 €
Vender
Roberto Fernández
DL
0
Roberto Fernández
3.100.000 €
20.000 €
Vender
Camello
DL
0
Camello
2.100.000 €
30.000 €
Vender
16
Jugadores
46,3M € 570.000 €
Valor de Equipo
1
En venta
-39.100 €
Saldo
`;

const MERCADO = `
Mercado
De Frutos
 Funesbuque, finaliza en 2 días
DL
/
MC
0
De Frutos
6.020.000 €
30.000 €
7.525.000 €
Pépé
 Funesbuque, finaliza en 2 días
DL
/
MC
0
Pépé
8.850.000 €
50.000 €
11.062.500 €
Carmona
 Funesbuque, finaliza en 2 días
DF
/
MC
0
Carmona
1.160.000 €
20.000 €
1.450.000 €
Jonny Castro
Libre, finaliza mañana
DF
0
Jonny Castro
1.290.000 €
20.000 €
Pujar
Laporte
Libre, finaliza mañana
DF
0
Laporte
5.120.000 €
70.000 €
Pujar
Lo Celso
Libre, finaliza mañana
MC
0
Lo Celso
4.000.000 €
30.000 €
Pujar
Logan Costa
Libre, finaliza mañana
DF
0
Logan Costa
170.000 €
Pujar
Evolución del mercado
Yamal
DL
Yamal
21.260.000 €
210.000 €
-39.100 €
Saldo
`;

describe("pegado real CHACHOS F.C (Henry)", () => {
  it("importa la plantilla Biwenger completa", () => {
    const result = parsePastedPlayers(PLANTILLA);
    const names = result.players.map((p) => p.name);

    expect(result.players.length).toBe(16);
    expect(names).not.toContain("En venta");
    expect(names).not.toContain("Henry");
    expect(names).toEqual(
      expect.arrayContaining([
        "Batalla",
        "Aitor Fernández",
        "Germán Parreño",
        "Huijsen",
        "Oso",
        "Quagliata",
        "Manu Sánchez",
        "Unai Núñez",
        "Kang-in Lee",
        "Barrenetxea",
        "Jauregizar",
        "Koke",
        "Lookman",
        "Ayoze",
        "Roberto Fernández",
        "Camello",
      ]),
    );
    expect(result.players.find((p) => p.name === "Germán Parreño")?.position).toBe(
      "portero",
    );
    expect(result.players.find((p) => p.name === "Lookman")?.value).toBe(
      7_960_000,
    );
    expect(result.players.find((p) => p.name === "Oso")?.extraPositions).toEqual(
      expect.arrayContaining(["centrocampista"]),
    );
    // Saldo negativo de la liga
    expect(result.meta.balance).toBe(-39_100);
  });

  it("importa mercado y corta evolución global", () => {
    const result = parsePastedPlayers(MERCADO);
    const names = result.players.map((p) => p.name);

    expect(names).toEqual(
      expect.arrayContaining([
        "De Frutos",
        "Pépé",
        "Carmona",
        "Jonny Castro",
        "Laporte",
        "Lo Celso",
        "Logan Costa",
      ]),
    );
    expect(names).not.toContain("Yamal");
    expect(result.players.find((p) => p.name === "De Frutos")?.clausePrice).toBe(
      7_525_000,
    );
    expect(result.meta.balance).toBe(-39_100);
  });

  it("genera un plan con plantilla real y saldo negativo", () => {
    const squadParsed = parsePastedPlayers(PLANTILLA);
    const marketParsed = parsePastedPlayers(MERCADO);
    const base = createDemoFormValues("biwenger");

    const input: AnalysisFormValues = {
      ...base,
      leagueName: "CHACHOS F.C",
      currentPosition: 6,
      balance: squadParsed.meta.balance ?? -39_100,
      allowNegativeBalance: false,
      squad: squadParsed.players.map((p) => ({
        id: createId("squad"),
        name: p.name,
        position: p.position ?? "centrocampista",
        value: p.value ?? 0,
        extraPositions: p.extraPositions ?? [],
        status: "disponible" as const,
        usualStarter: false,
        doNotSell: false,
      })),
      market: marketParsed.players.slice(0, 12).map((p) => ({
        id: createId("market"),
        name: p.name,
        position: p.position ?? "centrocampista",
        marketValue: p.value ?? 0,
        minPrice: p.clausePrice ?? p.value,
        estimatedBid: undefined,
        status: "disponible" as const,
        possibleStarter: true,
      })),
      analysisType: "completo",
    };

    expect(input.balance).toBe(-39_100);
    const plan = analyzeTeam(input);
    expect(plan.summary.length).toBeGreaterThan(10);
    expect(plan.mustSellBeforeBuy).toBe(true);
    expect(plan.sellRecommendations.length).toBeGreaterThan(0);
    expect(plan.generatedAt).toBeTruthy();
  });
});
