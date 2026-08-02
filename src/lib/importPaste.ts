import type { Position } from "@/lib/types";
import { normalizeName } from "@/lib/schemas";

export type ParsedPastePlayer = {
  name: string;
  position?: Position;
  value?: number;
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
  /^(plantilla|mercado|jugadores|equipo|mi equipo|squad|team|valor|saldo|posición|posicion|nombre|total|clasificación|clasificacion)\b/i;

/**
 * Interpreta texto pegado desde Biwenger, Comunio u otra fantasy
 * (Ctrl+A / Ctrl+C) y extrae nombres, posiciones y valores si aparecen.
 */
export function parsePastedPlayers(raw: string): PasteParseResult {
  const warnings: string[] = [];
  const players: ParsedPastePlayer[] = [];
  const seen = new Set<string>();
  let skippedLines = 0;

  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) {
    return { players: [], skippedLines: 0, warnings: ["No hay texto que importar."] };
  }

  const lines = expandToLines(text);

  for (const line of lines) {
    const cleaned = line.trim();
    if (!cleaned || NOISE_LINE.test(cleaned)) {
      skippedLines += 1;
      continue;
    }

    const parsed = parseLine(cleaned);
    if (!parsed) {
      skippedLines += 1;
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

  if (players.length === 0) {
    warnings.push(
      "No se detectaron jugadores. Pega una lista con un nombre por línea (y valor/posición si los tienes).",
    );
  } else if (players.some((p) => p.value === undefined)) {
    warnings.push(
      "Algunos jugadores no traían valor: revísalos y completa el precio en el formulario.",
    );
  }

  return { players, skippedLines, warnings };
}

function expandToLines(text: string): string[] {
  const lines: string[] = [];
  for (const block of text.split("\n")) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    // Listas en una sola línea: "A, B, C" o "A; B; C"
    if (
      !trimmed.includes("\t") &&
      (trimmed.includes(",") || trimmed.includes(";")) &&
      !/\d{1,3}(?:\.\d{3})+/.test(trimmed)
    ) {
      const parts = trimmed.split(/[,;]+/).map((p) => p.trim()).filter(Boolean);
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

  return {
    name,
    position,
    value,
  };
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
