import { describe, expect, it } from "vitest";
import { parsePastedPlayers, getPasteFailureHint } from "@/lib/importPaste";

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

  it("detecta saldos negativos etiquetados (Biwenger en números rojos)", () => {
    const raw = `
Lookman
DL
0
Lookman
7.960.000 €
Vender
-39.100 €
Saldo
38.560.000 €
Valor alineado
`;
    const result = parsePastedPlayers(raw);
    expect(result.meta.balance).toBe(-39_100);
    expect(result.players.some((p) => p.name === "Lookman")).toBe(true);
  });

  it("importa el texto de Compartir mercado de la app Biwenger", () => {
    const raw =
      "El mercado de hoy en mi liga #Biwenger: De Frutos, Pépé, Carmona, Aimar Oroz, Pathé Ciss, Sow, Ramón Enríquez, Peque, Marc Aguado, Javier Rueda, Nsongo, Buchanan, Freeman, Calero, Jonny Castro, Laporte, Lemar, Lo Celso, Víctor García, Logan Costa, Pablo Ramón, Angel Ortiz, Affengruber, Bisiwu, Selu Diallo, Kita, Brahim";
    const result = parsePastedPlayers(raw);
    expect(result.players.length).toBe(27);
    expect(result.players.map((p) => p.name)).toEqual(
      expect.arrayContaining([
        "De Frutos",
        "Pépé",
        "Laporte",
        "Lo Celso",
        "Brahim",
        "Pathé Ciss",
      ]),
    );
    expect(result.players.every((p) => p.value === undefined)).toBe(true);
    expect(result.warnings.join(" ")).toMatch(/Compartir/i);
  });

  it("parsea listados por bloques PORTEROS/DEFENSAS (cartel SofaScore)", () => {
    const raw = `
PLANTILLA
HENRY · CHACHOS F.C · SOFASCORE
PORTEROS
Batalla
0
3.650.000 €
Aitor Fernández
0
200.000 €
DEFENSAS
Huijsen
0
4.320.000 €
DELANTEROS
Lookman
0
7.960.000 €
`;
    const result = parsePastedPlayers(raw);
    expect(result.players).toHaveLength(4);
    expect(result.players.find((p) => p.name === "Batalla")).toMatchObject({
      position: "portero",
      value: 3_650_000,
    });
    expect(result.players.find((p) => p.name === "Huijsen")).toMatchObject({
      position: "defensa",
      value: 4_320_000,
    });
    expect(result.players.find((p) => p.name === "Lookman")).toMatchObject({
      position: "delantero",
      value: 7_960_000,
    });
  });

  it("recupera OCR ruidoso de cartel (nombres juntos y valores después)", () => {
    const raw = `
PLANTILLA
BIWENGER
DIEGO CORTES GONZALEZ - CHACHOS F.C - SOFASCORE
s
PORTEROS
ra
Oblak
4.130.000 €
Pl
8 $3 9
2.450.000 €
2270000 €
Adriá Altimira 0
Javier Ri
—_—
'CENTROCAMPISTAS
Arda Gill
Germán Valera 0
DeGalarreta 0
Amatueci 0
Rubén García 0
Dot
Aguado 0
7.300.000 €
5.950.000 €
3.140.000 €
2.850.000 €
000€
1:790/000 €
1.780.000 €
DELANTEROS
3.500.000 €
ta 0
Iván Rom
3.300.000 €
370.000 €
`;
    const result = parsePastedPlayers(raw);
    const names = result.players.map((p) => p.name);

    expect(names).toEqual(
      expect.arrayContaining([
        "Oblak",
        "Adriá Altimira",
        "Arda Güler",
        "Germán Valera",
        "De Galarreta",
        "Rubén García",
        "Aguado",
        "Iván Romero",
        "Javier Rueda",
      ]),
    );
    expect(names).not.toEqual(expect.arrayContaining(["Dot", "ra", "Pl"]));
    expect(result.players.find((p) => p.name === "Oblak")).toMatchObject({
      position: "portero",
      value: 4_130_000,
    });
    expect(result.players.find((p) => p.name === "Adriá Altimira")).toMatchObject({
      position: "defensa",
      value: 2_450_000,
    });
    expect(result.players.find((p) => p.name === "Javier Rueda")).toMatchObject({
      position: "defensa",
      value: 2_270_000,
    });
    expect(result.players.find((p) => p.name === "Arda Güler")).toMatchObject({
      position: "centrocampista",
      value: 7_300_000,
    });
    expect(result.players.find((p) => p.name === "Aguado")).toMatchObject({
      position: "centrocampista",
      value: 1_780_000,
    });
    expect(result.players.find((p) => p.name === "Iván Romero")).toMatchObject({
      position: "delantero",
      value: 3_500_000,
    });
    expect(result.players.length).toBeGreaterThanOrEqual(8);
    expect(
      result.players.every(
        (p) => p.value === undefined || p.value >= 50_000,
      ),
    ).toBe(true);
  });

  it("devuelve tips de fallo por plataforma", () => {
    expect(getPasteFailureHint("biwenger", "squad")).toMatch(/Plantilla/i);
    expect(getPasteFailureHint("comunio", "market")).toMatch(/Comunio/i);
    expect(getPasteFailureHint("laliga_fantasy", "squad")).toMatch(/LALIGA/i);
  });

  it("detecta estado lesionado/duda en el texto pegado", () => {
    const result = parsePastedPlayers(`
Plantilla
Pedri
MC
lesionado
Pedri
8.000.000 €
Vender
Yamal
DL
duda
Yamal
12.000.000 €
Vender
`);
    const pedri = result.players.find((p) => /pedri/i.test(p.name));
    const yamal = result.players.find((p) => /yamal/i.test(p.name));
    expect(pedri?.status).toBe("lesionado");
    expect(yamal?.status).toBe("duda");
  });

  it("distingue puja actual de la variación diaria pequeña", () => {
    const withBid = parsePastedPlayers(`
Mercado
De Frutos
DL
De Frutos
7.000.000 €
7.525.000 €
Pujar
`);
    expect(withBid.players[0]?.estimatedBid).toBe(7_525_000);

    const withDelta = parsePastedPlayers(`
Plantilla
Huijsen
DF
Huijsen
4.290.000 €
30.000 €
Vender
`);
    expect(withDelta.players[0]?.value).toBe(4_290_000);
    expect(withDelta.players[0]?.estimatedBid).toBeUndefined();
  });

  it("avisa si el pegado no trae estados", () => {
    const result = parsePastedPlayers(`
Aitor Fernández PT 200.000
Huijsen DF 4.290.000
Lookman DL 7.850.000
`);
    expect(
      result.warnings.some((w) => /estado|lesionado|icono/i.test(w)),
    ).toBe(true);
  });
});
