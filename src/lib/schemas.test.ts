import { describe, expect, it } from "vitest";
import { analysisFormSchema } from "@/lib/schemas";
import { createDemoFormValues, createDefaultFormValues } from "@/lib/demo";

describe("formulario / schema de integración", () => {
  it("acepta los datos de ejemplo completos", () => {
    const result = analysisFormSchema.safeParse(createDemoFormValues());
    expect(result.success).toBe(true);
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
