import { expect, test } from "@playwright/test";

async function generateDemoPlan(page: import("@playwright/test").Page) {
  await page.goto("/analizar");
  await page.getByRole("button", { name: "Probar con datos de ejemplo" }).click();
  await page
    .getByRole("navigation", { name: "Progreso del formulario" })
    .getByRole("button", { name: /6/ })
    .click();
  await page.getByRole("button", { name: "Generar plan" }).click();
  await page.waitForURL("**/resultado");
  await expect(
    page.getByRole("heading", { name: "Tu plan de acción" }),
  ).toBeVisible();
}

test.describe("Checklist, jornada e historial", () => {
  test("marca acciones y refleja progreso en historial", async ({ page }) => {
    await generateDemoPlan(page);

    await expect(
      page.getByRole("heading", { name: "Acciones de la jornada" }),
    ).toBeVisible();

    const firstAction = page
      .locator("#acciones label")
      .filter({ has: page.locator('input[type="checkbox"]') })
      .first();
    await firstAction.click();

    await expect(page.getByText("Reiniciar marcas")).toBeVisible();
    await expect(page.locator("#acciones").getByText(/^1\//)).toBeVisible();

    await page.getByRole("link", { name: "Historial" }).first().click();
    await page.waitForURL("**/historial");
    await expect(page.getByText(/Acciones 1\//)).toBeVisible();

    await page.getByRole("button", { name: "Ver resultado" }).first().click();
    await page.waitForURL("**/resultado");
    await page.getByText("Reiniciar marcas").click();
    await expect(page.getByText("Reiniciar marcas")).toHaveCount(0);
  });

  test("siguiente jornada abre presupuesto con plantilla lista", async ({
    page,
  }) => {
    await generateDemoPlan(page);

    await page.getByRole("button", { name: "Siguiente jornada" }).first().click();
    await page.waitForURL(/\/analizar\?jornada=1/);

    await expect(
      page.getByRole("heading", { name: "Presupuesto y mercado" }),
    ).toBeVisible();
    await expect(
      page.getByText(/Siguiente jornada: plantilla y reglas listas/i),
    ).toBeVisible();
  });

  test("editar desde historial vuelve al asistente", async ({ page }) => {
    await generateDemoPlan(page);

    await page.getByRole("link", { name: "Historial" }).first().click();
    await page.waitForURL("**/historial");
    await page.getByRole("button", { name: "Editar en asistente" }).first().click();
    await page.waitForURL(/\/analizar\?desde=historial/);

    await expect(
      page.getByRole("heading", { name: "Analizar mi equipo" }),
    ).toBeVisible();
  });

  test("exportar backup JSON desde historial", async ({ page }) => {
    await generateDemoPlan(page);
    await page.getByRole("link", { name: "Historial" }).first().click();
    await page.waitForURL("**/historial");

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar JSON" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/pujazo-backup-.*\.json/);
    await expect(page.getByRole("status").filter({ hasText: /Copia guardada/i })).toBeVisible();
  });
});
