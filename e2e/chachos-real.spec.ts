import { expect, test } from "@playwright/test";
import {
  CHACHOS_MERCADO,
  CHACHOS_MERCADO_SHARE,
  CHACHOS_PLANTILLA,
} from "./fixtures/chachos";

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
    await page.getByLabel("Importar plantilla").fill(CHACHOS_PLANTILLA);
    await page.getByRole("button", { name: "Importar texto" }).click();

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
      name: /Importar mercado/i,
    });
    if ((await marketToggle.getAttribute("aria-expanded")) === "false") {
      await marketToggle.click();
    }
    await page.getByLabel("Importar mercado").fill(CHACHOS_MERCADO);
    await page.getByRole("button", { name: "Importar texto" }).click();
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
      page.getByRole("heading", { name: /Top \d+ fichajes/i }),
    ).toBeVisible();
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

  test("importa el share móvil #Biwenger y genera plan con plantilla", async ({
    page,
  }) => {
    await page.goto("/analizar");

    await page
      .getByRole("navigation", { name: "Progreso del formulario" })
      .getByRole("button", { name: /3/ })
      .click();
    await page.getByLabel("Importar plantilla").fill(CHACHOS_PLANTILLA);
    await page.getByRole("button", { name: "Importar texto" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: /Importados 16 jugadores/i }),
    ).toBeVisible();

    await page
      .getByRole("navigation", { name: "Progreso del formulario" })
      .getByRole("button", { name: /4/ })
      .click();

    const marketToggle = page.getByRole("button", {
      name: /Importar mercado/i,
    });
    if ((await marketToggle.getAttribute("aria-expanded")) === "false") {
      await marketToggle.click();
    }

    await page.getByLabel("Importar mercado").fill(CHACHOS_MERCADO_SHARE);
    await page.getByRole("button", { name: "Importar texto" }).click();

    await expect(
      page.getByRole("status").filter({ hasText: /Importados 27 jugadores/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("status").filter({ hasText: /Compartir/i }),
    ).toBeVisible();

    const marketNames = await page
      .getByRole("textbox", { name: "Nombre" })
      .evaluateAll((els) => els.map((el) => (el as HTMLInputElement).value));
    expect(marketNames).toHaveLength(27);
    expect(marketNames).toContain("De Frutos");
    expect(marketNames).toContain("Laporte");
    expect(marketNames).toContain("Lo Celso");
    expect(marketNames).toContain("Brahim");

    // El share no trae precios: asignamos valores a candidatos clave
    await page.evaluate(() => {
      const prices: Record<string, number> = {
        "De Frutos": 6_020_000,
        "Pépé": 8_850_000,
        Laporte: 5_120_000,
        "Lo Celso": 4_000_000,
        Brahim: 1_890_000,
        Carmona: 1_160_000,
      };
      for (const card of document.querySelectorAll("li")) {
        const nameInput = card.querySelector(
          'input[name$=".name"]',
        ) as HTMLInputElement | null;
        const valueInput = card.querySelector(
          'input[name$=".marketValue"]',
        ) as HTMLInputElement | null;
        if (!nameInput || !valueInput) continue;
        const price = prices[nameInput.value];
        if (price == null) continue;
        const setter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value",
        )?.set;
        setter?.call(valueInput, String(price));
        valueInput.dispatchEvent(new Event("input", { bubbles: true }));
        valueInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

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
    await expect(
      page.getByRole("heading", { name: /Top \d+ fichajes/i }),
    ).toBeVisible();
    await expect(page.getByText(/#1/i).first()).toBeVisible();
  });
});
