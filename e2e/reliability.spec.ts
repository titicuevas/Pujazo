import { expect, test, type Page } from "@playwright/test";

async function loadDemo(page: Page) {
  await page.goto("/analizar");
  await page.getByRole("button", { name: "Probar con datos de ejemplo" }).click();
  await expect(
    page.getByText(/Datos de ejemplo \(.+\) cargados/i),
  ).toBeVisible();
}

async function goToStep(page: Page, step: number) {
  await page
    .getByRole("navigation", { name: "Progreso del formulario" })
    .getByRole("button", { name: new RegExp(String(step)) })
    .click();
}

async function clearMarket(page: Page) {
  await goToStep(page, 4);
  await expect(
    page.getByRole("heading", { name: "Presupuesto y mercado" }),
  ).toBeVisible();

  const removeBtn = page.getByRole("button", { name: /Eliminar candidato/i });
  while ((await removeBtn.count()) > 0) {
    await removeBtn.first().click();
  }
  await expect(page.getByText(/Sin candidatos todavía/i)).toBeVisible();
}

test.describe("Fiabilidad del plan", () => {
  test("demo genera plan con frase y acciones", async ({ page }) => {
    await loadDemo(page);
    await goToStep(page, 6);
    await page.getByRole("button", { name: "Generar plan" }).click();
    await page.waitForURL("**/resultado");

    await expect(page.getByRole("heading", { name: "Tu plan de acción" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "En una frase" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Acciones de la jornada" }),
    ).toBeVisible();
    await expect(page.getByText("Buena compra hasta").first()).toBeVisible();
    await expect(page.getByText(/Para poder pujar|Ventas recomendadas/i).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Revisa estos datos" })).toHaveCount(
      0,
    );
  });

  test("sin mercado pide confirmación y muestra aviso accionable", async ({
    page,
  }) => {
    await loadDemo(page);
    await clearMarket(page);

    page.once("dialog", (dialog) => {
      expect(dialog.message()).toMatch(/No hay jugadores en el mercado/i);
      void dialog.accept();
    });

    await goToStep(page, 6);
    await page.getByRole("button", { name: "Generar plan" }).click();
    await page.waitForURL("**/resultado");

    await expect(
      page.getByRole("heading", { name: "Revisa estos datos" }),
    ).toBeVisible();
    await expect(page.getByText(/No hay jugadores en el mercado/i)).toBeVisible();
    await expect(page.getByRole("link", { name: "Completar datos" })).toBeVisible();
  });

  test("cancelar confirmación de mercado vacío no navega", async ({ page }) => {
    await loadDemo(page);
    await clearMarket(page);

    let sawDialog = false;
    page.once("dialog", (dialog) => {
      sawDialog = true;
      void dialog.dismiss();
    });

    await goToStep(page, 6);
    await page.getByRole("button", { name: "Generar plan" }).click();

    await expect.poll(() => sawDialog).toBe(true);
    await expect(page).toHaveURL(/\/analizar/);
    await expect(
      page.getByText(/Pega o añade el mercado|cambia el tipo de análisis/i),
    ).toBeVisible();
  });

  test("bloquea generar si el mercado no tiene precios", async ({ page }) => {
    await loadDemo(page);
    await clearMarket(page);

    await page.getByRole("button", { name: "Añadir al mercado" }).click();
    await page.getByRole("textbox", { name: "Nombre" }).last().fill("Calero");
    await page.getByLabel("Valor de mercado (€)").last().fill("0");

    await goToStep(page, 6);
    await page.getByRole("button", { name: "Generar plan" }).click();

    await expect(page).toHaveURL(/\/analizar/);
    await expect(
      page.getByText(/Faltan precios|completa los €|sin precio/i).first(),
    ).toBeVisible();
  });
});
