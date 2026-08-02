import type { Position } from "@/lib/types";
import { normalizeName } from "@/lib/schemas";

export type ParsedPastePlayer = {
  name: string;
  position?: Position;
  /** Valor de mercado */
  value?: number;
  /** Posiciones extra (multifunción), si aparecen */
  extraPositions?: Position[];
  /** Cláusula / precio de compra si aparece en el mercado */
  clausePrice?: number;
};

export type PasteParseResult = {
  players: ParsedPastePlayer[];
  skippedLines: number;
  warnings: string[];
};

const POSITION_ALIASES: { position: Position; tokens: string[] }[] = [
  {
    position: "portero",
    tokens: ["portero", "porteros", "por", "gk", "pt", "goalkeeper"],
  },
  {
    position: "defensa",
    tokens: ["defensa", "defensas", "def", "df", "dfc", "li", "ld"],
  },
  {
    position: "centrocampista",
    tokens: [
      "centrocampista",
      "centrocampistas",
      "medio",
      "medios",
      "med",
      "mc",
      "cen",
      "mid",
      "mco",
      "mdi",
      "mdd",
    ],
  },
  {
    position: "delantero",
    tokens: ["delantero", "delanteros", "del", "dl", "st", "fwd", "dc", "ext"],
  },
];

const NOISE_LINE =
  /^(plantilla|noticias|mercado|jugadores|equipo|mi equipo|squad|team|valor|saldo|posición|posicion|nombre|total|clasificación|clasificacion|alineación|alineacion|estrategia|guardar alineación|guardar alineacion|suplentes|añadir|anadir|buscar|buscar jugador|vender|pujar|inicio|liga|jornada|evolución del mercado|evolucion del mercado|todos los jugadores|primera división|primera division|subidas|bajadas|más estadísticas|mas estadisticas|fecha|propietario|precio|chachos f\.?c\.?|biwenger)\b/i;

const POSITION_ONLY = /^(PT|DF|MC|DL|POR|DEF|MED|DEL|GK)$/i;

/**
 * Interpreta texto pegado desde Biwenger, Comunio u otra fantasy
 * (Ctrl+A / Ctrl+C). Prioriza el formato de tarjetas de Biwenger.
 */
export function parsePastedPlayers(raw: string): PasteParseResult {
  const warnings: string[] = [];
  let text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) {
    return {
      players: [],
      skippedLines: 0,
      warnings: ["No hay texto que importar."],
    };
  }

  text = trimToUsefulSection(text);

  const biwenger = parseBiwengerCards(text);
  if (biwenger && biwenger.players.length > 0) {
    return finalize(biwenger.players, biwenger.skippedLines, warnings);
  }

  return finalize(...parseLineByLine(text), warnings);
}

function finalize(
  players: ParsedPastePlayer[],
  skippedLines: number,
  warnings: string[],
): PasteParseResult {
  if (players.length === 0) {
    warnings.push(
      "No se detectaron jugadores. En Biwenger: Equipo → Plantilla (o Mercado), Ctrl+A, Ctrl+C y pega aquí.",
    );
  } else if (players.some((p) => p.value === undefined)) {
    warnings.push(
      "Algunos jugadores no traían valor: revísalos y completa el precio en el formulario.",
    );
  }
  return { players, skippedLines, warnings };
}

/** Quita alineación, catálogo global y ruido de UI de Biwenger. */
function trimToUsefulSection(text: string): string {
  let out = text;

  const plantilla = out.search(/(?:^|\n)\s*Plantilla(?:Noticias)?\b/i);
  if (plantilla >= 0) {
    out = out.slice(plantilla);
  }

  const cutCatalog = out.search(
    /(?:^|\n)\s*(Evolución del mercado|Evolucion del mercado|Todos los jugadores)\b/i,
  );
  if (cutCatalog >= 0) {
    out = out.slice(0, cutCatalog);
  }

  return out.trim();
}

function parseBiwengerCards(
  text: string,
): { players: ParsedPastePlayer[]; skippedLines: number } | null {
  const looksLikeBiwenger =
    /\b(Vender|Pujar)\b/i.test(text) &&
    /\b(PT|DF|MC|DL)\b/.test(text) &&
    /\d{1,3}(?:\.\d{3})+\s*€/.test(text);
  if (!looksLikeBiwenger) return null;

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const cards: string[][] = [];
  let buf: string[] = [];

  const flush = () => {
    if (buf.length) {
      cards.push(buf);
      buf = [];
    }
  };

  for (const line of lines) {
    if (/^(Vender|Pujar)$/i.test(line)) {
      buf.push(line);
      flush();
      continue;
    }

    // Nueva tarjeta si ya hay valor y aparece otro nombre de jugador
    if (
      buf.length > 0 &&
      cardHasMarketValue(buf) &&
      looksLikePlayerName(line) &&
      !isMoneyLine(line)
    ) {
      flush();
    }

    buf.push(line);
  }
  flush();

  const players: ParsedPastePlayer[] = [];
  const seen = new Set<string>();
  let skippedLines = 0;

  for (const card of cards) {
    const parsed = parseCardChunk(card);
    if (!parsed) {
      skippedLines += card.length;
      continue;
    }
    const key = normalizeName(parsed.name);
    if (seen.has(key)) {
      skippedLines += 1;
      continue;
    }
    seen.add(key);
    players.push(parsed);
  }

  return { players, skippedLines };
}

function parseCardChunk(chunk: string[]): ParsedPastePlayer | null {
  const lines = chunk.filter((l) => !/^(Vender|Pujar)$/i.test(l));
  const moneys: number[] = [];
  const positions: Position[] = [];
  const names: string[] = [];

  for (const line of lines) {
    if (line === "/" || line === "0") continue;
    if (NOISE_LINE.test(line)) continue;
    if (/finaliza\b/i.test(line) || /^Libre\b/i.test(line)) continue;

    if (POSITION_ONLY.test(line) || line === "/") {
      const pos = mapPositionToken(line);
      if (pos) positions.push(pos);
      continue;
    }

    // "MC / DL" en una línea
    if (/^(PT|DF|MC|DL)(\s*\/\s*(PT|DF|MC|DL))+$/i.test(line)) {
      for (const part of line.split("/")) {
        const pos = mapPositionToken(part.trim());
        if (pos) positions.push(pos);
      }
      continue;
    }

    if (isMoneyLine(line)) {
      const money = extractMoney(line);
      if (money !== undefined) moneys.push(money);
      continue;
    }

    if (!looksLikePlayerName(line)) continue;
    const name = cleanName(line);
    if (name) names.push(name);
  }

  if (names.length === 0) return null;

  // En Biwenger el nombre suele repetirse justo antes del valor
  const name = names[names.length - 1];
  const uniquePositions = [...new Set(positions)];
  const value = moneys[0];
  const clausePrice =
    moneys.length >= 3 && moneys[2] > (value ?? 0) ? moneys[2] : undefined;

  return {
    name,
    position: uniquePositions[0],
    extraPositions: uniquePositions.slice(1),
    value,
    clausePrice,
  };
}

function parseLineByLine(
  text: string,
): [ParsedPastePlayer[], number] {
  const players: ParsedPastePlayer[] = [];
  const seen = new Map<string, ParsedPastePlayer>();
  let skippedLines = 0;
  const lines = expandToLines(text);

  for (const line of lines) {
    const cleaned = line.trim();
    if (!cleaned || NOISE_LINE.test(cleaned) || cleaned === "/" || cleaned === "0") {
      skippedLines += 1;
      continue;
    }
    if (/finaliza\b/i.test(cleaned)) {
      skippedLines += 1;
      continue;
    }

    const parsed = parseLine(cleaned);
    if (!parsed) {
      skippedLines += 1;
      continue;
    }

    const key = normalizeName(parsed.name);
    const existing = seen.get(key);
    if (existing) {
      if (!existing.value && parsed.value) existing.value = parsed.value;
      if (!existing.position && parsed.position) {
        existing.position = parsed.position;
      }
      skippedLines += 1;
      continue;
    }
    seen.set(key, parsed);
    players.push(parsed);
  }

  return [players, skippedLines];
}

function cardHasMarketValue(buf: string[]): boolean {
  return buf.some((l) => isMoneyLine(l) && (extractMoney(l) ?? 0) >= 50_000);
}

function isMoneyLine(line: string): boolean {
  return (
    /€/.test(line) ||
    /^\d{1,3}(?:[.\s]\d{3})+(?:[.,]\d+)?$/.test(line.trim()) ||
    /^\d+[.,]\d+\s*[mM]$/.test(line.trim())
  );
}

function looksLikePlayerName(line: string): boolean {
  if (!line || NOISE_LINE.test(line) || POSITION_ONLY.test(line)) return false;
  if (isMoneyLine(line) || line === "/" || line === "0") return false;
  if (/finaliza\b/i.test(line)) return false;
  if (/^\d+$/.test(line)) return false;
  const name = cleanName(line);
  if (!name || name.length < 2) return false;
  if (name.split(/\s+/).length > 5) return false;
  return /[\p{L}]/u.test(name);
}

function expandToLines(text: string): string[] {
  const lines: string[] = [];
  for (const block of text.split("\n")) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    if (
      !trimmed.includes("\t") &&
      (trimmed.includes(",") || trimmed.includes(";")) &&
      !/\d{1,3}(?:\.\d{3})+/.test(trimmed) &&
      !/finaliza/i.test(trimmed)
    ) {
      const parts = trimmed
        .split(/[,;]+/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length >= 2 && parts.every((p) => p.split(/\s+/).length <= 4)) {
        lines.push(...parts);
        continue;
      }
    }
    lines.push(trimmed);
  }
  return lines;
}

function parseLine(line: string): ParsedPastePlayer | null {
  let working = line
    .replace(/[|·•]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const value = extractMoney(working);
  if (value !== undefined) {
    working = working
      .replace(/(\d+[.,]?\d*)\s*[mM]\b/g, " ")
      .replace(
        /(\d{1,3}(?:[.\s]\d{3})+|\d{4,9})(?:[.,]\d+)?\s*(?:€|eur|euros)?/gi,
        " ",
      )
      .replace(/\s+/g, " ")
      .trim();
  }

  const position = extractPosition(working);
  if (position) {
    working = stripPositionTokens(working);
  }

  const name = cleanName(working);
  if (!name || name.length < 2 || /^\d+$/.test(name)) return null;
  if (name.split(" ").length > 6) return null;

  return { name, position, value };
}

function extractMoney(line: string): number | undefined {
  const millions = line.match(/(\d+[.,]?\d*)\s*[mM]\b/);
  if (millions) {
    const n = Number(millions[1].replace(",", "."));
    if (!Number.isNaN(n) && n > 0) return Math.round(n * 1_000_000);
  }

  const european = line.match(/(\d{1,3}(?:[.\s]\d{3})+)(?:[.,]\d+)?/);
  if (european) {
    const n = Number(european[1].replace(/[.\s]/g, ""));
    if (!Number.isNaN(n) && n >= 1000) return n;
  }

  const plain = line.match(/(?:^|[^\d])(\d{4,9})(?:[^\d]|$)/);
  if (plain) {
    const n = Number(plain[1]);
    if (!Number.isNaN(n) && n >= 1000) return n;
  }

  return undefined;
}

function mapPositionToken(token: string): Position | undefined {
  const t = normalizeToken(token);
  for (const group of POSITION_ALIASES) {
    if (group.tokens.includes(t)) return group.position;
  }
  return undefined;
}

function extractPosition(line: string): Position | undefined {
  const tokens = tokenize(line);
  for (const group of POSITION_ALIASES) {
    if (tokens.some((t) => group.tokens.includes(t))) {
      return group.position;
    }
  }
  return undefined;
}

function stripPositionTokens(line: string): string {
  const all = new Set(POSITION_ALIASES.flatMap((g) => g.tokens));
  return line
    .split(/[\s/\-–—]+/)
    .filter((part) => !all.has(normalizeToken(part)))
    .join(" ")
    .trim();
}

function cleanName(raw: string): string {
  return raw
    .replace(/[€$]/g, " ")
    .replace(/\b(eur|euros|valor|precio|puja|min|máx|max)\b/gi, " ")
    .replace(/[^\p{L}\p{N}.'\-\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(line: string): string[] {
  return line
    .split(/[\s/\-–—|,;:()]+/)
    .map(normalizeToken)
    .filter(Boolean);
}

function normalizeToken(token: string): string {
  return token
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}
