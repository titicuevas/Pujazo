import { expect, test } from "@playwright/test";
import path from "node:path";

const plantillaShot = path.join(
  __dirname,
  "fixtures/biwenger-plantilla-lista.png",
);

test.describe("OCR captura Biwenger", () => {
  test("lee jugadores desde captura de plantilla (lista)", async ({ page }) => {
    test.setTimeout(180_000);

    await page.goto("/analizar");
    await page
      .getByRole("navigation", { name: "Progreso del formulario" })
      .getByRole("button", { name: /3/ })
      .click();

    await expect(page.getByRole("heading", { name: "Plantilla" })).toBeVisible();

    const panel = page.getByRole("button", { name: /Importar plantilla/i });
    if ((await panel.getAttribute("aria-expanded")) === "false") {
      await panel.click();
    }

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(plantillaShot);

    // Auto-import tras OCR exitoso
    await expect(
      page.getByRole("status").filter({
        hasText: /Importados|Se leyó texto|jugador/i,
      }),
    ).toBeVisible({ timeout: 160_000 });

    // Si importó solo, la lista del wizard debe tener filas; si no, queda texto en el área
    const imported = page.getByRole("status").filter({ hasText: /Importados/i });
    if (await imported.isVisible().catch(() => false)) {
      await expect(imported).toContainText(/jugador/i);
      return;
    }

    const area = page.getByLabel("Importar plantilla");
    const text = await area.inputValue();
    expect(text.length).toBeGreaterThan(40);

    // Debe reconocer al menos algunos nombres conocidos de la captura CHACHOS
    const lower = text.toLowerCase();
    const hits = ["batalla", "lookman", "huijsen", "koke", "ayoze"].filter((n) =>
      lower.includes(n),
    );
    expect(
      hits.length,
      `OCR débil. Texto parcial:\n${text.slice(0, 500)}`,
    ).toBeGreaterThanOrEqual(2);
  });
});
