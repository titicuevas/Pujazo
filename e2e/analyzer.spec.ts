import { expect, test } from "@playwright/test";

test.describe("Flujo del analizador", () => {
  test("carga demo, genera plan y muestra resultado", async ({ page }) => {
    await page.goto("/analizar");

    await expect(
      page.getByRole("heading", { name: "Analizar mi equipo" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Probar con datos de ejemplo" }).click();
    await expect(
      page.getByText("Datos de ejemplo cargados", { exact: false }),
    ).toBeVisible();

    await page.getByRole("navigation", { name: "Progreso del formulario" })
      .getByRole("button", { name: /6/ })
      .click();
    await expect(
      page.getByRole("heading", { name: "Tipo de análisis" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Generar plan" }).click();
    await page.waitForURL("**/resultado");

    await expect(
      page.getByRole("heading", { name: "Tu plan de acción" }),
    ).toBeVisible();
    await expect(
      page.getByText("Vender antes de fichar", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Fichaje prioritario" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Once recomendado" }),
    ).toBeVisible();
    await expect(page.getByText(/Capitán:/)).toBeVisible();
    await expect(page.getByText(/Ariete:/)).toBeVisible();
  });
});
