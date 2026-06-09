import { test, expect } from "@playwright/test"

const EMAIL    = process.env["E2E_EMAIL"]    ?? "dueno@salon.test"
const PASSWORD = process.env["E2E_PASSWORD"] ?? "password123"

test.describe("Gastos", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel(/email/i).fill(EMAIL)
    await page.getByLabel(/contraseña/i).fill(PASSWORD)
    await page.getByRole("button", { name: /iniciar sesión/i }).click()
    await expect(page).toHaveURL("/", { timeout: 15_000 })
  })

  test("registrar gasto y verificar que aparece en la tabla", async ({ page }) => {
    await page.goto("/gastos")

    await page.getByRole("button", { name: /nuevo gasto/i }).click()
    await expect(page.getByRole("dialog")).toBeVisible()

    const concepto = `Gasto E2E ${Date.now()}`
    await page.getByLabel(/concepto/i).fill(concepto)
    await page.getByLabel(/monto/i).fill("150")

    // Categoría
    const categoriaSelect = page.getByRole("combobox", { name: /categoría/i })
    await categoriaSelect.click()
    await page.getByRole("option").first().click()

    // Fecha (hoy por defecto, pero nos aseguramos)
    const hoy = new Date().toISOString().split("T")[0]
    const fechaInput = page.getByLabel(/fecha/i)
    if (await fechaInput.isVisible()) {
      await fechaInput.fill(hoy)
    }

    await page.getByRole("button", { name: /guardar/i }).click()
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5_000 })

    await expect(page.getByText(concepto)).toBeVisible({ timeout: 8_000 })
  })

  test("la gráfica de dona de gastos es visible en la página", async ({ page }) => {
    await page.goto("/gastos")

    // La gráfica de Recharts renderiza un SVG
    const chart = page.locator("svg").first()
    await expect(chart).toBeVisible({ timeout: 8_000 })
  })

  test("el gasto recién registrado incrementa el total del mes", async ({ page }) => {
    await page.goto("/gastos")

    // Leer total antes
    const totalTexto = await page.getByText(/total.*gastos|gastos.*total/i).textContent()
    const totalAntes = parseMXN(totalTexto ?? "0")

    // Crear nuevo gasto
    await page.getByRole("button", { name: /nuevo gasto/i }).click()
    await page.getByLabel(/concepto/i).fill("Gasto contador E2E")
    await page.getByLabel(/monto/i).fill("200")
    await page.getByRole("combobox", { name: /categoría/i }).click()
    await page.getByRole("option").first().click()
    await page.getByRole("button", { name: /guardar/i }).click()
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5_000 })

    // Leer total después
    await page.reload()
    const totalDespues = parseMXN(
      await page.getByText(/total.*gastos|gastos.*total/i).textContent() ?? "0"
    )

    expect(totalDespues).toBeGreaterThanOrEqual(totalAntes + 200)
  })
})

function parseMXN(text: string): number {
  return parseFloat(text.replace(/[^0-9.-]/g, "")) || 0
}
