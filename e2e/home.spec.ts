import { expect, test } from "@playwright/test";

test.describe("Home", () => {
  test("muestra marca, propuesta y CTA en español", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Pujazo, inicio" })).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Tu plantilla. Tu mercado. Tu próximo movimiento.",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Analizar mi equipo" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Empezar pegando plantilla" }),
    ).toBeVisible();
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "Privacidad" }),
    ).toBeVisible();
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "Cómo usar" }),
    ).toBeVisible();
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "Gratis / futuro" }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Aviso de independencia"),
    ).toContainText("herramienta independiente");
  });

  test("páginas de cómo usar, privacidad y precios cargan en español", async ({
    page,
  }) => {
    await page.goto("/como-usar");
    await expect(
      page.getByRole("heading", { name: "Cómo usar Pujazo" }),
    ).toBeVisible();
    await page.goto("/privacidad");
    await expect(page.getByRole("heading", { name: "Privacidad" })).toBeVisible();
    await expect(page.getByText(/localStorage/i)).toBeVisible();
    await page.goto("/precios");
    await expect(
      page.getByRole("heading", { name: /Gratis ahora/i }),
    ).toBeVisible();
    await expect(page.getByText(/Plan gratuito \(actual\)/i)).toBeVisible();
  });

  test("el enlace de saltar al contenido existe para teclado", async ({
    page,
  }) => {
    await page.goto("/");
    const skip = page.getByRole("link", { name: "Saltar al contenido" });
    await expect(skip).toHaveAttribute("href", "#contenido-principal");
  });
});
