import type { PlatformId, Position } from "@/lib/types";
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
  meta: PasteMeta;
};

export type PasteMeta = {
  /** Saldo detectado junto a la etiqueta “Saldo” en el pegado */
  balance?: number;
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
  /^(plantilla|noticias|mercado|jugadores|equipo|mi equipo|mis jugadores|squad|team|saldo|dinero|presupuesto|cash|posición|posicion|nombre|total|clasificación|clasificacion|alineación|alineacion|estrategia|guardar alineación|guardar alineacion|suplentes|añadir|anadir|buscar|buscar jugador|vender|pujar|comprar|inicio|liga|jornada|evolución del mercado|evolucion del mercado|todos los jugadores|primera división|primera division|subidas|bajadas|más estadísticas|mas estadisticas|fecha|propietario|ofertas|comunio|biwenger|laliga|fantasy|mi plantilla|mi mercado|chachos f\.?c\.?|en venta|valor de equipo|puntos)\b/i;

const POSITION_ONLY = /^(PT|DF|MC|DL|POR|DEF|MED|DEL|GK)$/i;

/** Clubes / ruido habitual entre nombre y valor en Comunio / LALIGA FANTASY */
const CLUB_OR_UI_LINE =
  /^(real madrid|fc barcelona|barcelona|barça|barca|atl[eé]tico(?: de madrid)?|athletic(?: club)?|sevilla|valencia|villarreal|real sociedad|betis|real betis|osasuna|celta(?: de vigo)?|mallorca|girona|getafe|alav[eé]s|deportivo alav[eé]s|las palmas|ud las palmas|rayo(?: vallecano)?|espanyol|legan[eé]s|valladolid|real valladolid|elche|c[aá]diz|granada|levante|almer[ií]a|huesca|eibar|mallorca|r\.? madrid|r\.? sociedad)\b/i;

/**
 * Interpreta texto pegado desde Biwenger, Comunio, LALIGA FANTASY u otra
 * (Ctrl+A / Ctrl+C). Prioriza tarjetas Biwenger y luego bloques Comunio/LF.
 */
export function parsePastedPlayers(raw: string): PasteParseResult {
  const warnings: string[] = [];
  let text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) {
    return {
      players: [],
      skippedLines: 0,
      warnings: ["No hay texto que importar."],
      meta: {},
    };
  }

  text = trimToUsefulSection(text);

  // Meta (saldo) desde el pegado completo: a veces va en cabecera/pie
  const meta = extractPasteMeta(raw.replace(/\r\n/g, "\n"));
  const biwenger = parseBiwengerCards(text);
  if (biwenger && biwenger.players.length > 0) {
    return finalize(biwenger.players, biwenger.skippedLines, warnings, meta);
  }

  const sequential = parseSequentialFantasy(text);
  if (sequential && sequential.players.length > 0) {
    return finalize(
      sequential.players,
      sequential.skippedLines,
      warnings,
      meta,
    );
  }

  const [players, skippedLines] = parseLineByLine(text);
  return finalize(players, skippedLines, warnings, meta);
}

function finalize(
  players: ParsedPastePlayer[],
  skippedLines: number,
  warnings: string[],
  meta: PasteMeta,
): PasteParseResult {
  // Descarta ruido de UI (p. ej. “En venta” + saldo negativo del pie)
  const cleaned = players.filter((player) => {
    if (/^en venta\b/i.test(player.name)) return false;
    if (player.value !== undefined && player.value < 0) return false;
    return true;
  });
  const dropped = players.length - cleaned.length;
  skippedLines += dropped;

  if (cleaned.length === 0) {
    warnings.push(
      "No se detectaron jugadores en el texto pegado.",
    );
  } else if (cleaned.some((p) => p.value === undefined)) {
    warnings.push(
      "Algunos jugadores no traían valor: revísalos y completa el precio en el formulario.",
    );
  }
  if (meta.balance !== undefined) {
    warnings.push(
      `Saldo detectado: ${meta.balance.toLocaleString("es-ES")} € (puedes corregirlo en Presupuesto).`,
    );
  }
  return { players: cleaned, skippedLines, warnings, meta };
}

/** Busca saldo/dinero etiquetado en pegados (Biwenger, Comunio, etc.). */
export function extractPasteMeta(raw: string): PasteMeta {
  const text = raw.replace(/\r\n/g, "\n");
  const candidates: number[] = [];

  // Biwenger suele poner el importe encima de la etiqueta “Saldo”
  for (const match of text.matchAll(
    /([^\n]+)\n\s*Saldo(?!\s+futuro)\b/gi,
  )) {
    const value = extractMoney(match[1].trim());
    if (value !== undefined) candidates.push(value);
  }
  for (const match of text.matchAll(
    /Saldo(?!\s+futuro)\b\s*\n\s*([^\n]+)/gi,
  )) {
    const value = extractMoney(match[1].trim());
    if (value !== undefined) candidates.push(value);
  }
  for (const match of text.matchAll(
    /(?:Dinero|Presupuesto|Cash|Disponible)\s*[:：]?\s*([^\n]+)/gi,
  )) {
    const value = extractMoney(match[1].trim());
    if (value !== undefined) candidates.push(value);
  }

  // Efectivo típico (puede ser negativo); evita “valor alineado” / plantilla enorme
  const cashLike = candidates.filter(
    (value) => Math.abs(value) >= 100 && Math.abs(value) < 20_000_000,
  );
  if (cashLike.length === 0) return {};

  const negative = cashLike.find((value) => value < 0);
  if (negative !== undefined) return { balance: negative };

  // Preferir el más pequeño en valor absoluto (saldo vs puja máxima)
  cashLike.sort((a, b) => Math.abs(a) - Math.abs(b));
  return { balance: cashLike[0] };
}

/** Quita alineación, catálogo global y ruido de UI. */
function trimToUsefulSection(text: string): string {
  let out = text;

  const plantilla = out.search(
    /(?:^|\n)\s*(Plantilla(?:Noticias)?|Mis jugadores|Mi plantilla)\b/i,
  );
  if (plantilla >= 0) {
    out = out.slice(plantilla);
  }

  const cutCatalog = out.search(
    /(?:^|\n)\s*(Evolución del mercado|Evolucion del mercado|Todos los jugadores|Clasificación general|Clasificacion general|Valor de Equipo)\b/i,
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

/**
 * Bloques estilo Comunio / LALIGA FANTASY:
 * Nombre → posición (POR/DEF/MED/DEL o palabra) → club opcional → valor.
 * También filas tabuladas: "Nombre\tPOR\t12.500.000".
 */
function parseSequentialFantasy(
  text: string,
): { players: ParsedPastePlayer[]; skippedLines: number } | null {
  const hasComunioPos =
    /(?:^|\n)\s*(POR|DEF|MED|DEL)\s*(?:\n|$)/m.test(text);
  const hasLabel =
    /(?:^|\n)\s*(Valor|Cláusula|Clausula)\b/im.test(text) ||
    /(?:^|\n)\s*(Portero|Defensa|Centrocampista|Delantero)s?\s*(?:\n|$)/im.test(
      text,
    );
  const hasMoney =
    /€/.test(text) ||
    /\d{1,3}(?:[.\s]\d{3})+/.test(text) ||
    /\d{5,}/.test(text);
  if ((!hasComunioPos && !hasLabel) || !hasMoney) return null;
  // Biwenger con Vender/Pujar ya se resolvió antes; si llega aquí sin esas
  // marcas, seguimos (Comunio casi nunca lleva “Vender” en el pegado).

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const players: ParsedPastePlayer[] = [];
  const seen = new Set<string>();
  let skippedLines = 0;
  let current: ParsedPastePlayer | null = null;

  const commit = () => {
    if (!current?.name) {
      current = null;
      return;
    }
    const key = normalizeName(current.name);
    if (seen.has(key)) {
      skippedLines += 1;
      current = null;
      return;
    }
    seen.add(key);
    players.push(current);
    current = null;
  };

  for (const line of lines) {
    // Etiquetas solas (sin importe); “Valor 4M €” se procesa más abajo
    if (
      /^(Valor|Cláusula|Clausula|Precio)\s*[:：]?\s*$/i.test(line) ||
      ((NOISE_LINE.test(line) || line === "/" || line === "0") && !/\d/.test(line))
    ) {
      skippedLines += 1;
      continue;
    }
    if (CLUB_OR_UI_LINE.test(line)) {
      skippedLines += 1;
      continue;
    }

    // Fila tabular: Nombre [tab|;] POS [tab|;] valor
    if (/\t/.test(line) || (/;/.test(line) && /\d/.test(line))) {
      const parts = line
        .split(/\t|;/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length >= 2) {
        commit();
        const tabular = parseLine(parts.join(" "));
        if (tabular) {
          current = tabular;
          commit();
        } else {
          skippedLines += 1;
        }
        continue;
      }
    }

    if (isMoneyLine(line) || /^\d{5,9}$/.test(line)) {
      const money = extractMoney(line);
      if (money !== undefined && current) {
        const isClause = /cl[aá]usula/i.test(line);
        if (isClause) {
          current.clausePrice = money;
        } else if (current.value === undefined) {
          current.value = money;
        } else if (
          current.clausePrice === undefined &&
          money > current.value
        ) {
          current.clausePrice = money;
        }
      } else {
        skippedLines += 1;
      }
      continue;
    }

    if (POSITION_ONLY.test(line)) {
      const pos = mapPositionToken(line);
      if (pos && current && !current.position) current.position = pos;
      else if (pos && current?.position && current.position !== pos) {
        current.extraPositions = [
          ...new Set([...(current.extraPositions ?? []), pos]),
        ];
      } else skippedLines += 1;
      continue;
    }

    // "Valor 4.200.000 €" / "Cláusula: 12M" en una sola línea
    if (/^(Valor|Cláusula|Clausula)\b/i.test(line) && /\d/.test(line)) {
      const money = extractMoney(line);
      if (money !== undefined && current) {
        if (/cl[aá]usula/i.test(line)) {
          current.clausePrice = money;
        } else if (current.value === undefined) {
          current.value = money;
        }
      } else skippedLines += 1;
      continue;
    }

    const fullWordPos = mapPositionToken(line);
    if (
      fullWordPos &&
      /^(portero|defensa|centrocampista|delantero)s?$/i.test(line.trim())
    ) {
      if (current && !current.position) current.position = fullWordPos;
      else skippedLines += 1;
      continue;
    }

    const inline = parseLine(line);
    if (
      inline &&
      (inline.position || inline.value) &&
      inline.name.split(/\s+/).length <= 5
    ) {
      commit();
      current = inline;
      continue;
    }

    if (looksLikePlayerName(line)) {
      commit();
      current = { name: cleanName(line) };
      continue;
    }

    skippedLines += 1;
  }
  commit();

  if (players.length === 0) return null;
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
      // Valores de mercado de jugador son >= 0; el saldo negativo va en meta
      if (money !== undefined && money >= 0) moneys.push(money);
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
    /^\d+[.,]\d+\s*[mM]$/.test(line.trim()) ||
    /^\d{5,9}$/.test(line.trim())
  );
}

function looksLikePlayerName(line: string): boolean {
  if (!line || NOISE_LINE.test(line) || POSITION_ONLY.test(line)) return false;
  if (CLUB_OR_UI_LINE.test(line)) return false;
  if (isMoneyLine(line) || line === "/" || line === "0") return false;
  if (/finaliza\b/i.test(line)) return false;
  if (/^en venta\b/i.test(line)) return false;
  if (/^\d+\s*d[ií]as?\b/i.test(line)) return false;
  if (/^\d+$/.test(line)) return false;
  const name = cleanName(line);
  if (!name || name.length < 2) return false;
  if (/^\d/.test(name)) return false;
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
  const negative = /^\s*[-−–]/.test(line);
  let amount: number | undefined;

  const millions = line.match(/(\d+[.,]?\d*)\s*[mM]\b/);
  if (millions) {
    const n = Number(millions[1].replace(",", "."));
    if (!Number.isNaN(n) && n > 0) amount = Math.round(n * 1_000_000);
  }

  if (amount === undefined) {
    const european = line.match(/(\d{1,3}(?:[.\s]\d{3})+)(?:[.,]\d+)?/);
    if (european) {
      const n = Number(european[1].replace(/[.\s]/g, ""));
      if (!Number.isNaN(n) && n >= 100) amount = n;
    }
  }

  if (amount === undefined) {
    const plain = line.match(/(?:^|[^\d])(\d{4,9})(?:[^\d]|$)/);
    if (plain) {
      const n = Number(plain[1]);
      if (!Number.isNaN(n) && n >= 1000) amount = n;
    }
  }

  if (amount === undefined) return undefined;
  // Permitir saldos pequeños tipo 39.100 € (antes el umbral era 1000 en europeo)
  if (!negative && amount < 1000 && !/€/.test(line)) return undefined;
  return negative ? -Math.abs(amount) : amount;
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

/** Consejo concreto cuando el pegado no detecta jugadores. */
export function getPasteFailureHint(
  platform: PlatformId,
  kind: "squad" | "market",
): string {
  const hints: Record<PlatformId, Record<"squad" | "market", string>> = {
    biwenger: {
      squad:
        "Consejo Biwenger: Equipo → Plantilla (no Alineación). El texto debería incluir “Vender” y valores con €.",
      market:
        "Consejo Biwenger: abre Mercado (venta/puja), no “Todos los jugadores”. Copia la cuadrícula con “Pujar”.",
    },
    comunio: {
      squad:
        "Consejo Comunio: copia la lista de tu equipo con nombres, POR/DEF/MED/DEL y valor. Si solo sales puntos o fotos, no bastará.",
      market:
        "Consejo Comunio: pega ofertas/mercado con nombre + posición + valor. Revisa luego las pujas a mano.",
    },
    laliga_fantasy: {
      squad:
        "Consejo LALIGA FANTASY: copia las fichas de plantilla (posición, Valor y Cláusula si aparecen).",
      market:
        "Consejo LALIGA FANTASY: pega candidatos del mercado con valor/cláusula visibles en texto.",
    },
    otro: {
      squad:
        "Consejo: pega un listado con nombre, posición y valor (una línea por jugador o bloques claros).",
      market:
        "Consejo: incluye al menos nombre y un precio/valor por candidato; completa a mano lo que falte.",
    },
  };
  return hints[platform]?.[kind] ?? hints.otro[kind];
}
