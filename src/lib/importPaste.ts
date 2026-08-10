import type { PlatformId, PlayerStatus, Position } from "@/lib/types";
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
  /** Puja actual / oferta en curso si se puede distinguir del valor */
  estimatedBid?: number;
  /** Estado si el texto lo trae (Biwenger a menudo solo lo muestra como icono) */
  status?: PlayerStatus;
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

const STATUS_LINE_PATTERNS: { status: PlayerStatus; pattern: RegExp }[] = [
  {
    status: "lesionado",
    pattern:
      /^(lesionado|lesionada|lesi[oó]n(?:ado|ada)?|injured|baja m[eé]dica|cruz m[eé]dica)\b/i,
  },
  {
    status: "sancionado",
    pattern:
      /^(sancionado|sancionada|sanci[oó]n|tarjeta roja|expulsado|expulsada|suspended)\b/i,
  },
  {
    status: "duda",
    pattern: /^(duda|doubtful|posible duda|en duda)\b/i,
  },
  {
    status: "no_confirmado",
    pattern:
      /^(no confirmado|no convocado|apartado|descartado|fuera de la convocatoria)\b/i,
  },
  {
    status: "disponible",
    pattern: /^(disponible|apto|fit)\b/i,
  },
];

function detectStatusToken(line: string): PlayerStatus | undefined {
  const trimmed = line.trim();
  for (const entry of STATUS_LINE_PATTERNS) {
    if (entry.pattern.test(trimmed)) return entry.status;
  }
  // Estado embebido: "Pedri lesionado", "Vinicius · Duda"
  const embedded = trimmed.match(
    /\b(lesionado|lesionada|lesi[oó]n|injured|sancionado|sancionada|tarjeta roja|duda|doubtful|no confirmado|no convocado)\b/i,
  );
  if (!embedded) return undefined;
  const token = embedded[1].toLowerCase();
  if (/lesion|injured/.test(token)) return "lesionado";
  if (/sancion|roja|expuls/.test(token)) return "sancionado";
  if (/duda|doubt/.test(token)) return "duda";
  if (/no confirm|no convoc/.test(token)) return "no_confirmado";
  return undefined;
}

/**
 * En Biwenger el 2.º importe suele ser variación diaria (pequeña) o puja actual.
 * Solo tratamos como puja si es una fracción relevante del valor.
 */
function assignMoneyFields(
  player: ParsedPastePlayer,
  moneys: number[],
): void {
  if (moneys.length === 0) return;
  player.value = moneys[0];
  if (moneys.length === 1) return;

  const value = moneys[0];
  const second = moneys[1];
  const third = moneys[2];

  // Importe claramente superior al valor → suelo/cláusula o puja en curso
  if (second > value) {
    player.clausePrice = second;
    player.estimatedBid = second;
  } else if (second >= value * 0.5) {
    // Puja cercana al valor (no variación diaria)
    player.estimatedBid = second;
  }

  if (third !== undefined && third > value) {
    player.clausePrice = third;
    if (player.estimatedBid === undefined || third >= (player.estimatedBid ?? 0)) {
      player.estimatedBid = third;
    }
  } else if (
    third !== undefined &&
    third >= value * 0.5 &&
    player.estimatedBid === undefined
  ) {
    player.estimatedBid = third;
  }
}

/** Clubes / ruido habitual entre nombre y valor en Comunio / LALIGA FANTASY */
const CLUB_OR_UI_LINE =
  /^(real madrid|fc barcelona|barcelona|barça|barca|atl[eé]tico(?: de madrid)?|athletic(?: club)?|sevilla|valencia|villarreal|real sociedad|betis|real betis|osasuna|celta(?: de vigo)?|mallorca|girona|getafe|alav[eé]s|deportivo alav[eé]s|las palmas|ud las palmas|rayo(?: vallecano)?|espanyol|legan[eé]s|valladolid|real valladolid|elche|c[aá]diz|granada|levante|almer[ií]a|huesca|eibar|mallorca|r\.? madrid|r\.? sociedad)\b/i;

/**
 * Interpreta texto pegado desde Biwenger, Comunio, LALIGA FANTASY u otra
 * (Ctrl+A / Ctrl+C, o “Compartir” en la app móvil).
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

  // Share móvil Biwenger: "El mercado de hoy… #Biwenger: A, B, C"
  // o "Mi equipo Biwenger: A, B, C"
  const mobileShare = parseBiwengerMobileShare(text);
  if (mobileShare && mobileShare.players.length > 0) {
    warnings.push(
      "Detectado el texto de “Compartir” de Biwenger (solo nombres). Completa valores a mano o importa también una captura de la lista con precios.",
    );
    return finalize(mobileShare.players, mobileShare.skippedLines, warnings, {});
  }

  text = trimToUsefulSection(text);
  text = normalizeOcrFantasyText(text);

  // Meta (saldo) desde el pegado completo: a veces va en cabecera/pie
  const meta = extractPasteMeta(raw.replace(/\r\n/g, "\n"));

  const sections = parsePositionSectionShare(text);
  if (sections && sections.players.length > 0) {
    return finalize(sections.players, sections.skippedLines, warnings, meta);
  }

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

/**
 * Texto al compartir desde la app Biwenger, p. ej.:
 * "El mercado de hoy en mi liga #Biwenger: De Frutos, Pépé, Carmona, …"
 * "Mi equipo Biwenger: Batalla, Huijsen, …"
 */
export function parseBiwengerMobileShare(
  raw: string,
): { players: ParsedPastePlayer[]; skippedLines: number } | null {
  const text = raw.replace(/\r\n/g, "\n").trim();
  const match =
    text.match(/#\s*Biwenger\s*:\s*([^\n]+)/i) ??
    text.match(/Mi\s+equipo\s+Biwenger\s*:\s*([^\n]+)/i) ??
    text.match(/Plantilla\s+Biwenger\s*:\s*([^\n]+)/i);
  if (!match?.[1]) return null;

  const list = match[1].trim();
  // Evitar falsos positivos si tras ":" no hay lista de nombres
  if (!list.includes(",") && list.split(/\s+/).length > 6) return null;

  const parts = list
    .split(/[,;]+/)
    .map((part) => cleanName(part))
    .filter(Boolean);

  const players: ParsedPastePlayer[] = [];
  const seen = new Set<string>();
  let skippedLines = 0;

  for (const name of parts) {
    if (!looksLikePlayerName(name)) {
      skippedLines += 1;
      continue;
    }
    const key = normalizeName(name);
    if (seen.has(key)) {
      skippedLines += 1;
      continue;
    }
    seen.add(key);
    players.push({ name });
  }

  if (players.length < 2) return null;
  return { players, skippedLines };
}

/**
 * Carteles / listados por bloque de posición (compartir SofaScore / plantilla):
 * PORTEROS / DEFENSAS / CENTROCAMPISTAS / DELANTEROS + nombre + valor.
 * El OCR a menudo desordena: precios antes o después de los nombres.
 * Colas dobles (nombres ↔ precios) + recorte de “porteros” fantasma si falta DEFENSAS.
 */
function parsePositionSectionShare(
  text: string,
): { players: ParsedPastePlayer[]; skippedLines: number } | null {
  const hasHeaders =
    /\b(PORTEROS|DEFENSAS|CENTROCAMPISTAS|DELANTEROS)\b/i.test(text);
  if (!hasHeaders) return null;
  const hasDefensasHeader = /\bDEFENSAS\b/i.test(text);

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const players: ParsedPastePlayer[] = [];
  const seen = new Set<string>();
  let skippedLines = 0;
  let currentPos: Position | undefined;
  const pendingNames: string[] = [];
  const pendingMoneys: number[] = [];

  const commit = (name: string, value?: number) => {
    const fixed = repairOcrPlayerName(name);
    const key = normalizeName(fixed);
    if (seen.has(key)) {
      skippedLines += 1;
      return;
    }
    seen.add(key);
    players.push({
      name: fixed,
      position: currentPos,
      value,
    });
  };

  /** Empareja colas y cierra la sección. */
  const settleSection = () => {
    while (pendingNames.length > 0 && pendingMoneys.length > 0) {
      commit(pendingNames.shift()!, pendingMoneys.shift()!);
    }
    while (pendingNames.length > 0) {
      commit(pendingNames.shift()!);
    }
    // Precios huérfanos de la sección: intentar rellenar jugadores sin valor
    while (pendingMoneys.length > 0) {
      const money = pendingMoneys.shift()!;
      const needy = players.find(
        (p) => p.position === currentPos && p.value === undefined,
      );
      if (needy) needy.value = money;
      else skippedLines += 1;
    }
  };

  const pushMoney = (money: number) => {
    if (pendingNames.length > 0) {
      commit(pendingNames.shift()!, money);
      return;
    }
    pendingMoneys.push(money);
  };

  const pushName = (name: string) => {
    if (pendingMoneys.length > 0) {
      commit(name, pendingMoneys.shift()!);
      return;
    }
    pendingNames.push(name);
  };

  for (const line of lines) {
    const headerMatch = line
      .replace(/^[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/, "")
      .match(/^(PORTEROS|DEFENSAS|CENTROCAMPISTAS|DELANTEROS)\b/i);
    if (headerMatch) {
      settleSection();
      const token = headerMatch[1].toLowerCase();
      currentPos =
        token.startsWith("porter")
          ? "portero"
          : token.startsWith("defens")
            ? "defensa"
            : token.startsWith("centro")
              ? "centrocampista"
              : "delantero";
      continue;
    }

    if (
      NOISE_LINE.test(line) ||
      /^(plantilla|mercado|sofascore|as biwenger|henry)\b/i.test(line) ||
      /\b(chachos\s*f\.?c\.?|sofascore)\b/i.test(line)
    ) {
      skippedLines += 1;
      continue;
    }

    if (/^\d+$/.test(line)) {
      continue;
    }

    if (isMoneyLine(line)) {
      const money = extractMoney(line);
      if (money !== undefined && money >= 50_000) {
        pushMoney(money);
      } else {
        skippedLines += 1;
      }
      continue;
    }

    if (isOcrNoiseLine(line)) {
      skippedLines += 1;
      continue;
    }

    // "Batalla 3.650.000 €" / "Adriá Altimira 0" en una línea
    const inline = parseLine(stripTrailingPoints(line));
    if (inline?.name && inline.value !== undefined && inline.value >= 50_000) {
      settleSection();
      commit(inline.name, inline.value);
      continue;
    }

    const nameCandidate = stripTrailingPoints(line);
    if (looksLikePlayerName(nameCandidate)) {
      pushName(cleanName(nameCandidate));
      continue;
    }

    skippedLines += 1;
  }

  settleSection();
  reclassifyGhostGoalkeepers(players, hasDefensasHeader);

  if (players.length < 2) return null;
  return { players, skippedLines };
}

/**
 * Si el OCR se come “DEFENSAS”, los laterales caen en PORTEROS.
 * Tras un portero caro, los siguientes más baratos pasan a defensa.
 */
function reclassifyGhostGoalkeepers(
  players: ParsedPastePlayer[],
  hasDefensasHeader: boolean,
): void {
  if (hasDefensasHeader) return;
  const gks = players.filter((p) => p.position === "portero");
  if (gks.length <= 2) return;
  const top = Math.max(...gks.map((p) => p.value ?? 0), 0);
  if (top < 500_000) return;

  let kept = 0;
  for (const player of gks) {
    const value = player.value ?? 0;
    const looksLikeOutfield =
      kept >= 1 &&
      value > 0 &&
      value < Math.min(top * 0.75, 3_800_000);
    if (looksLikeOutfield || kept >= 2) {
      player.position = "defensa";
    } else {
      kept += 1;
    }
  }
}

/** Correcciones OCR frecuentes en nombres de LaLiga (solo casos claros). */
function repairOcrPlayerName(name: string): string {
  const trimmed = name.trim();
  const fixes: Array<[RegExp, string]> = [
    [/^Arda\s+Gill$/i, "Arda Güler"],
    [/^Arda\s+Guler$/i, "Arda Güler"],
    [/^Iv[aá]n\s+Rom$/i, "Iván Romero"],
    [/^De\s*Galarreta$/i, "De Galarreta"],
    [/^Javier\s+Ri$/i, "Javier Rueda"],
  ];
  for (const [pattern, replacement] of fixes) {
    if (pattern.test(trimmed)) return replacement;
  }
  return trimmed;
}

/** Corrige basura típica de Tesseract en carteles Biwenger/SofaScore. */
function normalizeOcrFantasyText(text: string): string {
  return text
    .replace(/\u2014|\u2013|_+/g, " ")
    // 1:790/000 € → 1.790.000 €
    .replace(
      /(\d{1,3})[:/](\d{3})[:/.](\d{3})(\s*€)?/g,
      "$1.$2.$3$4",
    )
    // 1.790/000 o 1:790.000
    .replace(
      /(\d{1,3})[.:](\d{3})[/:](\d{3})(\s*€)?/g,
      "$1.$2.$3$4",
    )
    // 2270000 € → 2.270.000 € (7 dígitos pegados)
    .replace(
      /\b(\d)(\d{3})(\d{3})\s*€/g,
      "$1.$2.$3 €",
    )
    // Cabeceras con basura delante: 'CENTROCAMPISTAS
    .replace(
      /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ](PORTEROS|DEFENSAS|CENTROCAMPISTAS|DELANTEROS)\b/gi,
      "\n$1",
    )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

function stripTrailingPoints(line: string): string {
  return line.replace(/\s+0\s*$/u, "").trim();
}

/** Fragmentos OCR que no son nombres (badges, restos de iconos…). */
function isOcrNoiseLine(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  if (isMoneyLine(t)) return false;
  if (/^[^\p{L}]*$/u.test(t)) return true;
  if (/^[\d\s$€.,:/=_\-—–]+$/u.test(t)) return true;
  if (
    /^(ra|pl|pt|df|mc|dl|dot|ta|ss|lll|ll|oo|rn|il|nº|no)$/i.test(t)
  ) {
    return true;
  }
  // "8 $3 9", "ta 0"
  if (/^\d/.test(t) && t.length <= 8) return true;
  if (/^[a-zA-Z]{1,2}\s+\d+$/.test(t)) return true;
  return false;
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
  if (
    cleaned.length >= 3 &&
    cleaned.every((p) => p.status === undefined)
  ) {
    warnings.push(
      "No se detectó estado (lesionado/duda/sanción) en el pegado. Biwenger suele mostrarlo solo como icono: revísalo a mano en la plantilla.",
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
        } else if (money > current.value) {
          current.clausePrice = money;
          if (current.estimatedBid === undefined) {
            current.estimatedBid = money;
          }
        } else if (
          current.estimatedBid === undefined &&
          money >= current.value * 0.5
        ) {
          current.estimatedBid = money;
        }
      } else {
        skippedLines += 1;
      }
      continue;
    }

    const statusOnly = detectStatusToken(line);
    if (statusOnly && !looksLikePlayerName(line)) {
      if (current) current.status = statusOnly;
      else skippedLines += 1;
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
      const status = detectStatusToken(line);
      const name = cleanName(
        line.replace(
          /\b(lesionado|lesionada|sancionado|sancionada|duda|doubtful|no confirmado|no convocado)\b/gi,
          " ",
        ),
      );
      current = { name, status };
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
  let status: PlayerStatus | undefined;

  for (const line of lines) {
    if (line === "/" || line === "0") continue;
    if (NOISE_LINE.test(line)) continue;
    if (/finaliza\b/i.test(line) || /^Libre\b/i.test(line)) continue;

    const statusToken = detectStatusToken(line);
    if (statusToken && !looksLikePlayerName(line)) {
      status = statusToken;
      continue;
    }
    if (statusToken && looksLikePlayerName(line)) {
      // "Nombre lesionado" → status + name limpio más abajo
      status = statusToken;
    }

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
    const name = cleanName(
      line.replace(
        /\b(lesionado|lesionada|sancionado|sancionada|duda|doubtful|no confirmado)\b/gi,
        " ",
      ),
    );
    if (name) names.push(name);
  }

  if (names.length === 0) return null;

  // En Biwenger el nombre suele repetirse justo antes del valor
  const name = names[names.length - 1];
  const uniquePositions = [...new Set(positions)];
  const player: ParsedPastePlayer = {
    name,
    position: uniquePositions[0],
    extraPositions: uniquePositions.slice(1),
    status,
  };
  assignMoneyFields(player, moneys);
  return player;
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
  if (isOcrNoiseLine(line)) return false;
  if (CLUB_OR_UI_LINE.test(line)) return false;
  if (/\b(chachos\s*f\.?c\.?|sofascore|biwenger)\b/i.test(line)) return false;
  if (isMoneyLine(line) || line === "/" || line === "0") return false;
  if (/finaliza\b/i.test(line)) return false;
  if (/^en venta\b/i.test(line)) return false;
  if (/^\d+\s*d[ií]as?\b/i.test(line)) return false;
  if (/^\d+$/.test(line)) return false;
  const name = cleanName(stripTrailingPoints(line));
  if (!name || name.length < 3) return false;
  if (/^\d/.test(name)) return false;
  if (name.split(/\s+/).length > 5) return false;
  // Iniciales sueltas / restos OCR de 1 token muy corto
  if (name.split(/\s+/).length === 1 && name.length < 3) return false;
  return /[\p{L}]{3,}/u.test(name);
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

  const status = detectStatusToken(working);

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

  working = working
    .replace(
      /\b(lesionado|lesionada|sancionado|sancionada|duda|doubtful|no confirmado|no convocado|disponible|apto)\b/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();

  const name = cleanName(working);
  if (!name || name.length < 2 || /^\d+$/.test(name)) return null;
  if (name.split(" ").length > 6) return null;

  return { name, position, value, status };
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
    .replace(/\s+0\s*$/u, " ")
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
        "Consejo Biwenger: Equipo → Plantilla, o Comparte desde la app. Si pegas el share, completa valores; si usas captura, elige la lista con “Vender”, no el cartel.",
      market:
        "Consejo Biwenger: en la app, Mercado → Compartir y pega el texto #Biwenger. Luego rellena precios o captura la rejilla del mercado.",
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
