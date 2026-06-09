/**
 * import-excel.ts
 * Migra datos desde un archivo Excel VBA al sistema de control.
 * Uso: npx tsx src/scripts/import-excel.ts [ruta-del-archivo.xlsm]
 */

import { config } from "dotenv"
config({ path: ".env.local", override: true })

import * as XLSX from "xlsx"
import * as readline from "readline"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../generated/prisma/client"

// ── Setup Prisma ──────────────────────────────────────────────────────────────

const pool    = new Pool({ connectionString: process.env.DIRECT_URL })
const adapter = new PrismaPg(pool)
const prisma  = new PrismaClient({ adapter })

// ── Helpers ───────────────────────────────────────────────────────────────────

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve))
}

function parseDate(v: unknown): Date | null {
  if (!v) return null
  if (typeof v === "number") {
    // Excel serial date
    return new Date((v - 25569) * 86400 * 1000)
  }
  const d = new Date(String(v))
  return isNaN(d.getTime()) ? null : d
}

function parseNum(v: unknown): number {
  return isNaN(Number(v)) ? 0 : Number(v)
}

function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
}

// Mapeo automático: variantes comunes de nombres de columnas
const COLUMN_ALIASES: Record<string, string[]> = {
  nombre:    ["nombre", "name", "client", "cliente"],
  apellido:  ["apellido", "apellidos", "last_name"],
  telefono:  ["telefono", "tel", "phone", "celular", "movil"],
  email:     ["email", "correo", "mail"],
  concepto:  ["concepto", "descripcion", "servicio", "producto", "detalle"],
  monto:     ["monto", "importe", "total", "precio", "costo", "amount"],
  fecha:     ["fecha", "date", "dia", "fecha_venta", "fecha_gasto"],
  categoria: ["categoria", "category", "tipo", "rubro"],
  cantidad:  ["cantidad", "qty", "unidades", "piezas"],
  metodo:    ["metodo", "pago", "forma_pago", "metodo_pago", "payment"],
}

function findColumn(headers: string[], field: string): string | undefined {
  const normalized = headers.map(normalizeKey)
  const aliases    = COLUMN_ALIASES[field] ?? [field]
  for (const alias of aliases) {
    const idx = normalized.findIndex((h) => h.includes(alias))
    if (idx !== -1) return headers[idx]
  }
  return undefined
}

// ── Procesadores por tipo de hoja ─────────────────────────────────────────────

async function importarClientes(
  rows: Record<string, unknown>[],
  rl:   readline.Interface,
): Promise<number> {
  const headers = rows.length ? Object.keys(rows[0]) : []
  const colNombre   = findColumn(headers, "nombre")
  const colApellido = findColumn(headers, "apellido")
  const colTelefono = findColumn(headers, "telefono")
  const colEmail    = findColumn(headers, "email")

  console.log("\n  Columnas detectadas para CLIENTES:")
  console.log(`    nombre   → ${colNombre   ?? "(no encontrado)"}`)
  console.log(`    apellido → ${colApellido ?? "(no encontrado)"}`)
  console.log(`    telefono → ${colTelefono ?? "(no encontrado)"}`)
  console.log(`    email    → ${colEmail    ?? "(no encontrado)"}`)

  const ok = await ask(rl, "\n  ¿Continuar? (s/n): ")
  if (ok.toLowerCase() !== "s") { console.log("  Omitido."); return 0 }

  let count = 0
  for (const row of rows) {
    const nombre = colNombre ? String(row[colNombre] ?? "").trim() : ""
    if (!nombre) continue
    await prisma.cliente.upsert({
      where:  { id: (row["id"] as string | undefined) ?? "00000000-0000-0000-0000-000000000000" },
      update: {},
      create: {
        nombre,
        apellido: colApellido ? String(row[colApellido] ?? "").trim() || null : null,
        telefono: colTelefono ? String(row[colTelefono] ?? "").trim() || null : null,
        email:    colEmail    ? String(row[colEmail]    ?? "").trim() || null : null,
      },
    })
    count++
  }
  return count
}

async function importarGastos(
  rows: Record<string, unknown>[],
  rl:   readline.Interface,
): Promise<number> {
  const headers     = rows.length ? Object.keys(rows[0]) : []
  const colConcepto  = findColumn(headers, "concepto")
  const colMonto     = findColumn(headers, "monto")
  const colFecha     = findColumn(headers, "fecha")
  const colCategoria = findColumn(headers, "categoria")

  console.log("\n  Columnas detectadas para GASTOS:")
  console.log(`    concepto  → ${colConcepto  ?? "(no encontrado)"}`)
  console.log(`    monto     → ${colMonto     ?? "(no encontrado)"}`)
  console.log(`    fecha     → ${colFecha     ?? "(no encontrado)"}`)
  console.log(`    categoria → ${colCategoria ?? "(no encontrado — default: Otros)"}`)

  const ok = await ask(rl, "\n  ¿Continuar? (s/n): ")
  if (ok.toLowerCase() !== "s") { console.log("  Omitido."); return 0 }

  let count = 0
  for (const row of rows) {
    const concepto = colConcepto ? String(row[colConcepto] ?? "").trim() : ""
    const monto    = colMonto    ? parseNum(row[colMonto])               : 0
    const fecha    = colFecha    ? parseDate(row[colFecha])              : new Date()
    if (!concepto || monto <= 0 || !fecha) continue

    await prisma.gasto.create({
      data: {
        concepto,
        monto,
        fecha,
        categoria: colCategoria ? String(row[colCategoria] ?? "Otros").trim() : "Otros",
      },
    })
    count++
  }
  return count
}

async function importarVentas(
  rows: Record<string, unknown>[],
  rl:   readline.Interface,
): Promise<number> {
  const headers    = rows.length ? Object.keys(rows[0]) : []
  const colConcepto = findColumn(headers, "concepto")
  const colMonto    = findColumn(headers, "monto")
  const colFecha    = findColumn(headers, "fecha")
  const colMetodo   = findColumn(headers, "metodo")
  const colCantidad = findColumn(headers, "cantidad")

  console.log("\n  Columnas detectadas para VENTAS:")
  console.log(`    concepto → ${colConcepto ?? "(no encontrado)"}`)
  console.log(`    monto    → ${colMonto    ?? "(no encontrado)"}`)
  console.log(`    fecha    → ${colFecha    ?? "(no encontrado)"}`)
  console.log(`    método   → ${colMetodo   ?? "(no encontrado — default: efectivo)"}`)
  console.log(`    cantidad → ${colCantidad ?? "(no encontrado — default: 1)"}`)

  const ok = await ask(rl, "\n  ¿Continuar? (s/n): ")
  if (ok.toLowerCase() !== "s") { console.log("  Omitido."); return 0 }

  // Obtener primer cliente como fallback
  const primerCliente = await prisma.cliente.findFirst()

  let count = 0
  for (const row of rows) {
    const concepto = colConcepto ? String(row[colConcepto] ?? "").trim()  : ""
    const total    = colMonto    ? parseNum(row[colMonto])                : 0
    const fecha    = colFecha    ? parseDate(row[colFecha])               : new Date()
    const cantidad = colCantidad ? Math.max(1, parseNum(row[colCantidad])): 1
    if (!concepto || total <= 0 || !fecha) continue

    const rawMetodo = colMetodo ? String(row[colMetodo] ?? "").toLowerCase() : ""
    const metodoPago = rawMetodo.includes("tarjeta")  ? "tarjeta"
                     : rawMetodo.includes("transfer") ? "transferencia"
                     : "efectivo"

    const precioUnitario = total / cantidad

    await prisma.venta.create({
      data: {
        clienteId:      primerCliente?.id ?? "",
        tipo:           "servicio",
        concepto,
        cantidad,
        precioUnitario,
        subtotal:       total,
        descuento:      0,
        total,
        metodoPago,
        fecha,
      },
    })
    count++
  }
  return count
}

// ── Detectar tipo de hoja ─────────────────────────────────────────────────────

function detectarTipo(sheetName: string, headers: string[]): string {
  const name = sheetName.toLowerCase()
  const norm = headers.map(normalizeKey).join(" ")

  if (name.includes("client") || name.includes("cliente"))                return "clientes"
  if (name.includes("gasto") || name.includes("egreso"))                  return "gastos"
  if (name.includes("venta") || name.includes("ingreso") || name.includes("cobro")) return "ventas"
  if (norm.includes("telefono") || norm.includes("apellido"))             return "clientes"
  if (norm.includes("monto") && norm.includes("categoria"))               return "gastos"
  if (norm.includes("monto") || norm.includes("total"))                   return "ventas"
  return "desconocido"
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error("Uso: npx tsx src/scripts/import-excel.ts <archivo.xlsm>")
    process.exit(1)
  }

  console.log(`\n📂 Leyendo: ${filePath}`)
  let workbook: XLSX.WorkBook
  try {
    workbook = XLSX.readFile(filePath, { cellDates: false })
  } catch {
    console.error("❌ No se pudo abrir el archivo. Verifica la ruta.")
    process.exit(1)
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const resumen: Record<string, number> = {}

  console.log(`\n📋 Hojas encontradas: ${workbook.SheetNames.join(", ")}\n`)

  for (const sheetName of workbook.SheetNames) {
    const sheet  = workbook.Sheets[sheetName]
    const rows   = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })
    if (rows.length === 0) { console.log(`⬜ Hoja "${sheetName}" vacía — omitida`); continue }

    const headers = Object.keys(rows[0])
    const tipo    = detectarTipo(sheetName, headers)

    console.log(`\n━━━ Hoja: "${sheetName}" (${rows.length} filas, tipo detectado: ${tipo}) ━━━`)
    console.log("  Primeras 3 filas:")
    rows.slice(0, 3).forEach((r, i) => {
      const preview = Object.entries(r).slice(0, 5).map(([k, v]) => `${k}: ${v}`).join(" | ")
      console.log(`  [${i + 1}] ${preview}`)
    })

    if (tipo === "desconocido") {
      console.log("  ⚠️  Tipo no reconocido — omitiendo")
      continue
    }

    const proceed = await ask(rl, `\n  Importar como ${tipo.toUpperCase()}? (s/n): `)
    if (proceed.toLowerCase() !== "s") { console.log("  Omitido."); continue }

    let imported = 0
    if      (tipo === "clientes") imported = await importarClientes(rows, rl)
    else if (tipo === "gastos")   imported = await importarGastos(rows, rl)
    else if (tipo === "ventas")   imported = await importarVentas(rows, rl)

    resumen[sheetName] = imported
    console.log(`  ✅ ${imported} registros importados`)
  }

  rl.close()

  console.log("\n\n📊 Resumen de importación:")
  let total = 0
  for (const [hoja, cnt] of Object.entries(resumen)) {
    console.log(`   ${hoja}: ${cnt} registros`)
    total += cnt
  }
  console.log(`   TOTAL: ${total} registros\n`)
}

main()
  .catch((e) => { console.error("❌ Error:", e.message); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); await pool.end() })
