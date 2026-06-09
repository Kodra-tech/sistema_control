import { test, expect } from "@playwright/test"

const VALID_EMAIL    = process.env["E2E_EMAIL"]    ?? "dueno@salon.test"
const VALID_PASSWORD = process.env["E2E_PASSWORD"] ?? "password123"

test.describe("Autenticación", () => {
  test("login con credenciales incorrectas muestra mensaje de error", async ({ page }) => {
    await page.goto("/login")

    await page.getByLabel(/email/i).fill("usuario@incorrecto.com")
    await page.getByLabel(/contraseña/i).fill("claveIncorrecta123")
    await page.getByRole("button", { name: /iniciar sesión/i }).click()

    await expect(
      page.getByText(/credenciales inválidas|email o contraseña|invalid/i)
    ).toBeVisible({ timeout: 8_000 })
  })

  test("login correcto redirige al dashboard", async ({ page }) => {
    await page.goto("/login")

    await page.getByLabel(/email/i).fill(VALID_EMAIL)
    await page.getByLabel(/contraseña/i).fill(VALID_PASSWORD)
    await page.getByRole("button", { name: /iniciar sesión/i }).click()

    await expect(page).toHaveURL("/", { timeout: 15_000 })
    await expect(page.getByText(/dashboard/i)).toBeVisible()
  })

  test("acceder a /ventas sin sesión redirige al login", async ({ page }) => {
    await page.goto("/ventas")
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test("logout redirige al login", async ({ page }) => {
    // Login primero
    await page.goto("/login")
    await page.getByLabel(/email/i).fill(VALID_EMAIL)
    await page.getByLabel(/contraseña/i).fill(VALID_PASSWORD)
    await page.getByRole("button", { name: /iniciar sesión/i }).click()
    await expect(page).toHaveURL("/", { timeout: 15_000 })

    // Abrir menú de usuario y cerrar sesión
    await page.getByRole("button", { name: /avatar|usuario|perfil/i }).click()
    await page.getByRole("menuitem", { name: /cerrar sesión/i }).click()

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })
})
