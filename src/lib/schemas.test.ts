import { describe, expect, it } from "vitest";
import { analysisFormSchema } from "@/lib/schemas";
import { createDemoFormValues, createDefaultFormValues } from "@/lib/demo";

describe("formulario / schema de integración", () => {
  it("acepta los datos de ejemplo completos", () => {
    const result = analysisFormSchema.safeParse(createDemoFormValues());
    expect(result.success).toBe(true);
  });

  it("acepta demos por plataforma con sus presets", () => {
    for (const platform of [
      "biwenger",
      "comunio",
      "laliga_fantasy",
      "otro",
    ] as const) {
      const values = createDemoFormValues(platform);
      const result = analysisFormSchema.safeParse(values);
      expect(result.success, platform).toBe(true);
      expect(values.platform).toBe(platform);
      expect(values.maxPlayers).toBe(values.rules.maxPlayers);
      if (platform === "comunio") {
        expect(values.squad.length).toBeGreaterThan(18);
        expect(values.rules.captainEnabled).toBe(false);
      }
      if (platform === "laliga_fantasy") {
        expect(values.rules.strikerEnabled).toBe(false);
        expect(values.rules.matchdayChanges).toBe(3);
      }
    }
  });

  it("exige nombre de fantasy cuando la plataforma es Otro", () => {
    const values = createDefaultFormValues();
    values.platform = "otro";
    values.customPlatformName = "";
    values.squad = createDemoFormValues().squad.slice(0, 11);
    const result = analysisFormSchema.safeParse(values);
    expect(result.success).toBe(false);
  });

  it("avisa si un jugador está en plantilla y mercado", () => {
    const values = createDemoFormValues();
    values.market[0] = {
      ...values.market[0],
      name: values.squad[0].name,
    };
    const result = analysisFormSchema.safeParse(values);
    expect(result.success).toBe(false);
  });
});
