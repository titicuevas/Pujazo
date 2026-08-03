import { describe, expect, it } from "vitest";
import { EXAMPLE_LEAGUE_RULES } from "@/lib/constants";
import { leagueRulesToPlainText } from "@/lib/export";

describe("leagueRulesToPlainText", () => {
  it("exporta números, opciones y textos de las reglas", () => {
    const text = leagueRulesToPlainText(EXAMPLE_LEAGUE_RULES, {
      platformLabel: "Biwenger",
      leagueName: "CHACHOS F.C",
    });

    expect(text).toContain("PUJAZO — Reglas de la liga");
    expect(text).toContain("Liga: CHACHOS F.C");
    expect(text).toContain("Plataforma: Biwenger");
    expect(text).toContain("Máximo de jugadores: 18");
    expect(text).toContain("Dinero por punto:");
    expect(text).toContain("Capitán activado: Sí");
    expect(text).toContain("REGLAS ADICIONALES");
    expect(text).toContain("NOTAS PRIVADAS");
  });
});
