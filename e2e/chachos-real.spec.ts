import { expect, test } from "@playwright/test";
import { CHACHOS_MERCADO, CHACHOS_PLANTILLA } from "./fixtures/chachos";

test.describe("Pegado real CHACHOS F.C", () => {
  test("importa plantilla/mercado, respeta saldo negativo y genera plan", async ({
    page,
  }) => {
    await page.goto("/analizar");

    await page
      .getByRole("navigation", { name: "Progreso del formulario" })
      .getByRole("button", { name: /2/ })
      .click();
    await expect(
      page.getByRole("heading", { name: "Contexto de la liga" }),
    ).toBeVisible();
    await page.getByLabel(/Nombre de la liga/i).fill("CHACHOS F.C");
    await page.getByLabel(/Tu posición actual/i).fill("6");

    await page
      .getByRole("navigation", { name: "Progreso del formulario" })
      .getByRole("button", { name: /3/ })
      .click();

    await expect(page.getByRole("heading", { name: "Plantilla" })).toBeVisible();
    await page
      .getByLabel("Pegar plantilla (recomendado)")
      .fill(CHACHOS_PLANTILLA);
    await page.getByRole("button", { name: "Importar pegado" }).click();

    await expect(
      page.getByRole("status").filter({ hasText: /Importados 16 jugadores/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("status").filter({ hasText: /Saldo detectado: -39\.100/i }),
    ).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Nombre" }).nth(0)).toHaveValue(
      "Batalla",
    );
    const squadNames = await page
      .getByRole("textbox", { name: "Nombre" })
      .evaluateAll((els) => els.map((el) => (el as HTMLInputElement).value));
    expect(squadNames).toContain("Lookman");
    expect(squadNames).toContain("Camello");
    expect(squadNames).not.toContain("Henry");
    expect(squadNames).not.toContain("En venta");
    expect(squadNames).toHaveLength(16);

    await page
      .getByRole("navigation", { name: "Progreso del formulario" })
      .getByRole("button", { name: /4/ })
      .click();

    await expect(
      page.getByRole("heading", { name: "Presupuesto y mercado" }),
    ).toBeVisible();
    await expect(page.getByLabel("Saldo disponible (€)")).toHaveValue("-39100");
    await expect(page.getByLabel(/Saldo negativo permitido/i)).toBeChecked();

    const marketToggle = page.getByRole("button", {
      name: /Pegar mercado \(recomendado\)/i,
    });
    if (await marketToggle.getAttribute("aria-expanded") === "false") {
      await marketToggle.click();
    }
    await page.getByLabel("Pegar mercado (recomendado)").fill(CHACHOS_MERCADO);
    await page.getByRole("button", { name: "Importar pegado" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: /Importados \d+ jugadores/i }),
    ).toBeVisible();
    const marketNames = await page
      .getByRole("textbox", { name: "Nombre" })
      .evaluateAll((els) => els.map((el) => (el as HTMLInputElement).value));
    expect(marketNames).toContain("De Frutos");
    expect(marketNames).not.toContain("Yamal");

    await page
      .getByRole("navigation", { name: "Progreso del formulario" })
      .getByRole("button", { name: /6/ })
      .click();
    await page.getByRole("button", { name: "Generar plan" }).click();
    await page.waitForURL("**/resultado");

    await expect(
      page.getByRole("heading", { name: "Tu plan de acción" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Fichaje prioritario" }),
    ).toBeVisible();
    await expect(page.getByText(/De Frutos/i).first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Ventas recomendadas" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Once recomendado" }),
    ).toBeVisible();

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(false);

    await page.getByRole("link", { name: "Historial" }).first().click();
    await page.waitForURL("**/historial");
    await expect(
      page.getByRole("heading", { name: "Historial de planes" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Abrir" }).first()).toBeVisible();
  });
});
