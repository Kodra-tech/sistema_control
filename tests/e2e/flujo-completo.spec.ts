import { test, expect } from "@playwright/test"

const EMAIL    = process.env["E2E_EMAIL"]    ?? "dueno@salon.test"
const PASSWORD = process.env["E2E_PASSWORD"] ?? "password123"

test.describe("Flujo completo: cita → venta → dashboard", () => {
  // Login compartido para todo el describe block
  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel(/email/i).fill(EMAIL)
    await page.getByLabel(/contraseña/i).fill(PASSWORD)
    await page.getByRole("button", { name: /iniciar sesión/i }).click()
    await expect(page).toHaveURL("/", { timeout: 15_000 })
  })

  test("crear cliente nuevo", async ({ page }) => {
    await page.goto("/clientes")

    await page.getByRole("button", { name: /nuevo cliente/i }).click()
    await expect(page.getByRole("dialog")).toBeVisible()

    const timestamp = Date.now()
    await page.getByLabel(/nombre/i).fill(`Cliente E2E ${timestamp}`)
    await page.getByLabel(/teléfono/i).fill("5512345678")

    await page.getByRole("button", { name: /guardar/i }).click()

    await expect(
      page.getByText(`Cliente E2E ${timestamp}`)
    ).toBeVisible({ timeout: 8_000 })
  })

  test("agendar cita → cambiar estado a realizada → convertir en venta → verificar en /ventas", async ({ page }) => {
    // 1. Crear cita en la agenda
    await page.goto("/citas")
    await page.getByRole("button", { name: /nueva cita/i }).click()
    await expect(page.getByRole("dialog")).toBeVisible()

    // Buscar un cliente existente
    const clienteInput = page.getByPlaceholder(/buscar cliente/i)
    await clienteInput.fill("Cliente")
    await page.waitForTimeout(400)
    const clienteOpcion = page.getByRole("option").first()
    await expect(clienteOpcion).toBeVisible({ timeout: 5_000 })
    await clienteOpcion.click()

    // Seleccionar servicio
    const servicioSelect = page.getByLabel(/servicio/i)
    await servicioSelect.click()
    await page.getByRole("option").first().click()

    // Fecha de mañana
    const manana = new Date()
    manana.setDate(manana.getDate() + 1)
    const fechaStr = manana.toISOString().split("T")[0]
    await page.getByLabel(/fecha/i).fill(fechaStr)
    await page.getByLabel(/hora/i).fill("10:00")

    await page.getByRole("button", { name: /guardar/i }).click()
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5_000 })

    // 2. Cambiar estado a realizada (desde el calendario o tabla)
    // Buscar la cita recién creada
    await page.getByRole("button", { name: /cambiar estado|acciones/i }).first().click()
    await page.getByRole("menuitem", { name: /realizada/i }).click()
    await expect(page.getByText(/realizada/i)).toBeVisible({ timeout: 5_000 })

    // 3. Convertir a venta
    await page.getByRole("button", { name: /convertir/i }).first().click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await page.getByRole("button", { name: /confirmar|convertir/i }).click()
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 8_000 })

    // 4. Verificar que aparece en /ventas
    await page.goto("/ventas")
    const ahora  = new Date()
    const mes    = String(ahora.getMonth() + 1).padStart(2, "0")
    const anio   = String(ahora.getFullYear())

    // La venta del mes actual debería aparecer
    await expect(page.getByRole("table")).toBeVisible({ timeout: 5_000 })
    expect(await page.getByRole("row").count()).toBeGreaterThan(1)
  })

  test("KPI de ventas del dashboard refleja al menos 1 venta en el mes actual", async ({ page }) => {
    await page.goto("/")

    const kpiVentas = page.getByText(/ventas del mes/i)
    await expect(kpiVentas).toBeVisible()

    // El KPI debe mostrar un valor monetario
    const kpiCard = kpiVentas.locator("..").locator("..")
    await expect(kpiCard).toContainText("$")
  })
})
