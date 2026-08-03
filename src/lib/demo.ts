import { EXAMPLE_LEAGUE_RULES, PLATFORM_RULE_PRESETS } from "@/lib/constants";
import { createId } from "@/lib/format";
import type { AnalysisFormValues } from "@/lib/schemas";
import type {
  MarketPlayer,
  PlatformId,
  Position,
  PlayerStatus,
  SquadPlayer,
} from "@/lib/types";

type SquadDraft = {
  id?: string;
  name: string;
  position: Position;
  value: number;
  extraPositions?: Position[];
  status?: PlayerStatus;
  usualStarter?: boolean;
  doNotSell?: boolean;
};

type MarketDraft = {
  id?: string;
  name: string;
  position: Position;
  marketValue: number;
  minPrice?: number;
  estimatedBid?: number;
  status?: PlayerStatus;
  possibleStarter?: boolean;
};

function squadPlayer(partial: SquadDraft): SquadPlayer {
  return {
    id: partial.id ?? createId("squad"),
    name: partial.name,
    position: partial.position,
    value: partial.value,
    extraPositions: partial.extraPositions ?? [],
    status: partial.status ?? "disponible",
    usualStarter: partial.usualStarter ?? false,
    doNotSell: partial.doNotSell ?? false,
  };
}

function marketPlayer(partial: MarketDraft): MarketPlayer {
  return {
    id: partial.id ?? createId("market"),
    name: partial.name,
    position: partial.position,
    marketValue: partial.marketValue,
    minPrice: partial.minPrice,
    estimatedBid: partial.estimatedBid,
    status: partial.status ?? "disponible",
    possibleStarter: partial.possibleStarter ?? false,
  };
}

/** Plantilla y mercado ficticios (sin jugadores reales ni marcas). */
export function createDemoFormValues(
  platform: PlatformId = "biwenger",
): AnalysisFormValues {
  const squad: SquadPlayer[] = [
    squadPlayer({
      name: "K. Rivas",
      position: "portero",
      value: 4_500_000,
      usualStarter: true,
      doNotSell: true,
    }),
    squadPlayer({
      name: "M. Ordóñez",
      position: "portero",
      value: 1_200_000,
      status: "disponible",
    }),
    squadPlayer({
      name: "L. Paredes",
      position: "defensa",
      value: 6_800_000,
      usualStarter: true,
      doNotSell: true,
    }),
    squadPlayer({
      name: "S. Valle",
      position: "defensa",
      value: 5_200_000,
      usualStarter: true,
      extraPositions: ["centrocampista"],
    }),
    squadPlayer({
      name: "T. Negrete",
      position: "defensa",
      value: 3_100_000,
      usualStarter: true,
    }),
    squadPlayer({
      name: "I. Camino",
      position: "defensa",
      value: 2_400_000,
      status: "duda",
    }),
    squadPlayer({
      name: "R. Solís",
      position: "defensa",
      value: 1_800_000,
    }),
    squadPlayer({
      name: "J. Ferrera",
      position: "defensa",
      value: 900_000,
      status: "sancionado",
    }),
    squadPlayer({
      name: "A. Quintana",
      position: "centrocampista",
      value: 9_500_000,
      usualStarter: true,
      doNotSell: true,
    }),
    squadPlayer({
      name: "N. Beltrán",
      position: "centrocampista",
      value: 7_200_000,
      usualStarter: true,
      extraPositions: ["defensa"],
    }),
    squadPlayer({
      name: "P. Ledesma",
      position: "centrocampista",
      value: 4_600_000,
      usualStarter: true,
    }),
    squadPlayer({
      name: "E. Montiel",
      position: "centrocampista",
      value: 2_900_000,
      status: "no_confirmado",
    }),
    squadPlayer({
      name: "V. Serna",
      position: "centrocampista",
      value: 1_500_000,
    }),
    squadPlayer({
      name: "C. Aranda",
      position: "delantero",
      value: 11_000_000,
      usualStarter: true,
      doNotSell: true,
    }),
    squadPlayer({
      name: "D. Prado",
      position: "delantero",
      value: 6_400_000,
      usualStarter: true,
    }),
    squadPlayer({
      name: "H. Ballester",
      position: "delantero",
      value: 3_300_000,
      status: "lesionado",
    }),
    squadPlayer({
      name: "F. Urrutia",
      position: "delantero",
      value: 2_100_000,
    }),
    squadPlayer({
      name: "O. Gálvez",
      position: "centrocampista",
      value: 1_100_000,
      status: "disponible",
    }),
  ];

  const market: MarketPlayer[] = [
    marketPlayer({
      name: "Y. Cordero",
      position: "delantero",
      marketValue: 8_200_000,
      minPrice: 8_200_000,
      estimatedBid: 9_000_000,
      possibleStarter: true,
      status: "disponible",
    }),
    marketPlayer({
      name: "B. Espino",
      position: "centrocampista",
      marketValue: 5_500_000,
      minPrice: 5_500_000,
      estimatedBid: 6_200_000,
      possibleStarter: true,
    }),
    marketPlayer({
      name: "Z. Merino",
      position: "defensa",
      marketValue: 4_000_000,
      estimatedBid: 4_400_000,
      possibleStarter: true,
      status: "duda",
    }),
    marketPlayer({
      name: "W. Cazalla",
      position: "portero",
      marketValue: 2_800_000,
      estimatedBid: 3_100_000,
    }),
    marketPlayer({
      name: "U. Peñalver",
      position: "delantero",
      marketValue: 3_600_000,
      estimatedBid: 3_900_000,
      status: "no_confirmado",
      possibleStarter: false,
    }),
  ];

  const preset =
    PLATFORM_RULE_PRESETS.find((p) => p.id === platform) ??
    PLATFORM_RULE_PRESETS.find((p) => p.id === "biwenger")!;
  const rules = { ...preset.rules };

  // Comunio suele admitir más plazas: rellenamos cupo con suplentes ficticios.
  let finalSquad = squad;
  if (platform === "comunio" && rules.maxPlayers > squad.length) {
    const extras: SquadDraft[] = [
      { name: "G. Nieto", position: "defensa", value: 700_000 },
      { name: "Q. Haro", position: "centrocampista", value: 650_000 },
      { name: "X. Briñas", position: "delantero", value: 800_000 },
      { name: "Y. Collado", position: "defensa", value: 550_000 },
    ];
    finalSquad = [
      ...squad,
      ...extras
        .slice(0, rules.maxPlayers - squad.length)
        .map((draft) => squadPlayer(draft)),
    ];
  }

  const leagueName =
    platform === "comunio"
      ? "Comunidad de ejemplo Pujazo"
      : platform === "laliga_fantasy"
        ? "Liga Fantasy de ejemplo Pujazo"
        : platform === "otro"
          ? "Liga genérica de ejemplo Pujazo"
          : "Liga de ejemplo Pujazo";

  const balance =
    platform === "comunio"
      ? 1_850_000
      : platform === "laliga_fantasy"
        ? 3_200_000
        : 2_400_000;

  return {
    platform,
    customPlatformName: platform === "otro" ? "Mi fantasy" : "",
    leagueName,
    participants: platform === "comunio" ? 14 : 10,
    currentPosition: 6,
    matchday: 12,
    strategy: "equilibrado",
    squad: finalSquad,
    balance,
    maxPlayers: rules.maxPlayers,
    allowNegativeBalance: false,
    market,
    rules,
    analysisType: "completo",
    concreteDoubt:
      "Solo puedo fichar a uno. ¿A quién compro y qué debería vender?",
  };
}

export function createEmptySquadPlayer(): SquadPlayer {
  return squadPlayer({
    name: "",
    position: "centrocampista",
    value: 0,
    extraPositions: [],
    status: "disponible",
    usualStarter: false,
    doNotSell: false,
  });
}

export function createEmptyMarketPlayer(): MarketPlayer {
  return marketPlayer({
    name: "",
    position: "centrocampista",
    marketValue: 0,
    status: "disponible",
    possibleStarter: false,
  });
}

export function createDefaultFormValues(): AnalysisFormValues {
  return {
    platform: "biwenger",
    customPlatformName: "",
    leagueName: "",
    participants: 10,
    currentPosition: 5,
    matchday: 1,
    strategy: "equilibrado",
    squad: [],
    balance: 0,
    maxPlayers: 18,
    allowNegativeBalance: false,
    market: [],
    rules: { ...EXAMPLE_LEAGUE_RULES },
    analysisType: "completo",
    concreteDoubt: "",
  };
}
