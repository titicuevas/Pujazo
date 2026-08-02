import { expect, test } from "@playwright/test";

const BIWENGER_SQUAD_PASTE = `
Plantilla
Aitor Fernández
PT
0
Aitor Fernández
200.000 €
Vender
Huijsen
DF
0
Huijsen
4.290.000 €
30.000 €
Vender
Lookman
DL
0
Lookman
7.850.000 €
110.000 €
Vender
3,8M €
Saldo
`;

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
      page.getByRole("button", { name: "Copiar plan" }),
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
    await expect(page.getByRole("heading", { name: "En una frase" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Guardar PDF / Imprimir" }),
    ).toBeVisible();
  });

  test("guarda en historial y permite reabrir el plan", async ({ page }) => {
    await page.goto("/analizar");
    await page.getByRole("button", { name: "Probar con datos de ejemplo" }).click();
    await page
      .getByRole("navigation", { name: "Progreso del formulario" })
      .getByRole("button", { name: /6/ })
      .click();
    await page.getByRole("button", { name: "Generar plan" }).click();
    await page.waitForURL("**/resultado");

    await page.getByRole("link", { name: "Historial" }).first().click();
    await page.waitForURL("**/historial");
    await expect(
      page.getByRole("heading", { name: "Historial de planes" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Abrir" }).first()).toBeVisible();

    await page.getByRole("button", { name: "Abrir" }).first().click();
    await page.waitForURL("**/resultado");
    await expect(
      page.getByRole("heading", { name: "Tu plan de acción" }),
    ).toBeVisible();
  });

  test("modo comparar muestra tabla de candidatos", async ({ page }) => {
    await page.goto("/analizar");
    await page.getByRole("button", { name: "Probar con datos de ejemplo" }).click();

    await page
      .getByRole("navigation", { name: "Progreso del formulario" })
      .getByRole("button", { name: /6/ })
      .click();

    await page.getByLabel(/Comparar jugadores/i).click();
    await page.getByRole("button", { name: "Generar plan" }).click();
    await page.waitForURL("**/resultado");

    await expect(
      page.getByRole("heading", { name: "Comparativa de candidatos" }),
    ).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Score" })).toBeVisible();
    await expect(page.getByText(/Comparativa de candidatos/i).first()).toBeVisible();
  });

  test("importa plantilla pegada estilo Biwenger", async ({ page }) => {
    await page.goto("/analizar");

    await page
      .getByRole("navigation", { name: "Progreso del formulario" })
      .getByRole("button", { name: /3/ })
      .click();

    await expect(page.getByRole("heading", { name: "Plantilla" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Importar pegado" }),
    ).toBeVisible();

    await page
      .getByLabel("Pegar plantilla (recomendado)")
      .fill(BIWENGER_SQUAD_PASTE);
    await page.getByRole("button", { name: "Importar pegado" }).click();

    await expect(page.getByText(/Importados 3 jugadores/i)).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Nombre" }).nth(0)).toHaveValue(
      "Aitor Fernández",
    );
    await expect(page.getByRole("textbox", { name: "Nombre" }).nth(1)).toHaveValue(
      "Huijsen",
    );
    await expect(page.getByRole("textbox", { name: "Nombre" }).nth(2)).toHaveValue(
      "Lookman",
    );

    await page
      .getByRole("navigation", { name: "Progreso del formulario" })
      .getByRole("button", { name: /4/ })
      .click();
    await expect(
      page.getByRole("heading", { name: "Presupuesto y mercado" }),
    ).toBeVisible();
    await expect(page.getByLabel("Saldo disponible (€)")).toHaveValue("3800000");
  });
});
