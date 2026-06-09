import { config } from "dotenv"
config({ path: ".env.local", override: true })
config({ path: ".env" })

import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

const pool    = new Pool({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "" })
const adapter = new PrismaPg(pool)
const prisma  = new PrismaClient({ adapter })

// costo = 35% del precio redondeado a 2 decimales
const c = (precio: number, pct = 0.35) => Math.round(precio * pct * 100) / 100

type SeedServicio = {
  nombre: string
  categoria: string
  precio: number
  costo: number
  duracionMinutos: number
  descripcion?: string
}

const SERVICIOS: SeedServicio[] = [
  // ─── Corte (12) ──────────────────────────────────────────────────────────
  { categoria: "Corte", nombre: "Corte dama cabello corto",  precio: 150, costo: c(150), duracionMinutos: 45 },
  { categoria: "Corte", nombre: "Corte dama cabello largo",  precio: 200, costo: c(200), duracionMinutos: 60 },
  { categoria: "Corte", nombre: "Corte caballero",           precio: 120, costo: c(120), duracionMinutos: 30 },
  { categoria: "Corte", nombre: "Corte niño",                precio: 100, costo: c(100), duracionMinutos: 30 },
  { categoria: "Corte", nombre: "Corte niña",                precio: 120, costo: c(120), duracionMinutos: 40 },
  { categoria: "Corte", nombre: "Fleco",                     precio:  80, costo: c( 80), duracionMinutos: 15 },
  { categoria: "Corte", nombre: "Corte con navaja",          precio: 180, costo: c(180), duracionMinutos: 45 },
  { categoria: "Corte", nombre: "Degradado / Fade",          precio: 150, costo: c(150), duracionMinutos: 40 },
  { categoria: "Corte", nombre: "Corte creativo",            precio: 250, costo: c(250), duracionMinutos: 60 },
  { categoria: "Corte", nombre: "Corte + Brushing",          precio: 280, costo: c(280), duracionMinutos: 75, descripcion: "Corte y modelado con brushing profesional" },
  { categoria: "Corte", nombre: "Corte + Planchado",         precio: 300, costo: c(300), duracionMinutos: 90 },
  { categoria: "Corte", nombre: "Despuntado",                precio: 100, costo: c(100), duracionMinutos: 30, descripcion: "Retiro de puntas sin cambio de largo" },

  // ─── Color (15) ──────────────────────────────────────────────────────────
  { categoria: "Color", nombre: "Tinte completo (cabello corto)",  precio: 350, costo: c(350), duracionMinutos:  90 },
  { categoria: "Color", nombre: "Tinte completo (cabello largo)",  precio: 500, costo: c(500), duracionMinutos: 120 },
  { categoria: "Color", nombre: "Retoque de raíces",               precio: 250, costo: c(250), duracionMinutos:  60 },
  { categoria: "Color", nombre: "Mechas",                          precio: 450, costo: c(450), duracionMinutos: 120, descripcion: "Mechas clásicas con papel de aluminio" },
  { categoria: "Color", nombre: "Balayage",                        precio: 800, costo: c(800), duracionMinutos: 180, descripcion: "Técnica de iluminación a mano" },
  { categoria: "Color", nombre: "Highlights / Luces",              precio: 600, costo: c(600), duracionMinutos: 150 },
  { categoria: "Color", nombre: "Decoloración completa",           precio: 700, costo: c(700), duracionMinutos: 150 },
  { categoria: "Color", nombre: "Matiz / Gloss",                   precio: 200, costo: c(200), duracionMinutos:  30, descripcion: "Baño de brillo y tono" },
  { categoria: "Color", nombre: "Color fantasía",                  precio: 400, costo: c(400), duracionMinutos:  90, descripcion: "Colores vibrantes y no convencionales" },
  { categoria: "Color", nombre: "Ombré / Sombré",                  precio: 750, costo: c(750), duracionMinutos: 180 },
  { categoria: "Color", nombre: "Baby lights",                     precio: 900, costo: c(900), duracionMinutos: 180, descripcion: "Luces muy finas de efecto natural" },
  { categoria: "Color", nombre: "Color + Corte (paquete)",         precio: 650, costo: c(650), duracionMinutos: 150 },
  { categoria: "Color", nombre: "Baño de color",                   precio: 180, costo: c(180), duracionMinutos:  45 },
  { categoria: "Color", nombre: "Tinte + Hidratación",             precio: 600, costo: c(600), duracionMinutos: 120 },
  { categoria: "Color", nombre: "Glossing capilar",                precio: 200, costo: c(200), duracionMinutos:  30, descripcion: "Sellado de brillo y color" },

  // ─── Tratamientos (12) ───────────────────────────────────────────────────
  { categoria: "Tratamientos", nombre: "Hidratación profunda",              precio:  250, costo: c( 250), duracionMinutos:  45 },
  { categoria: "Tratamientos", nombre: "Keratina brasileña (cabello corto)", precio:  800, costo: c( 800), duracionMinutos: 120, descripcion: "Alisado suave con keratina" },
  { categoria: "Tratamientos", nombre: "Keratina brasileña (cabello largo)", precio: 1200, costo: c(1200), duracionMinutos: 180, descripcion: "Alisado suave con keratina" },
  { categoria: "Tratamientos", nombre: "Botox capilar",                     precio:  600, costo: c( 600), duracionMinutos:  90, descripcion: "Relleno de fibra capilar" },
  { categoria: "Tratamientos", nombre: "Anti-frizz express",                precio:  300, costo: c( 300), duracionMinutos:  60 },
  { categoria: "Tratamientos", nombre: "Ampolleta reparadora",              precio:  180, costo: c( 180), duracionMinutos:  30 },
  { categoria: "Tratamientos", nombre: "Mascarilla nutritiva",              precio:  200, costo: c( 200), duracionMinutos:  45 },
  { categoria: "Tratamientos", nombre: "Alisado permanente",                precio: 1500, costo: c(1500), duracionMinutos: 180 },
  { categoria: "Tratamientos", nombre: "Permanente rizado",                 precio:  500, costo: c( 500), duracionMinutos: 120 },
  { categoria: "Tratamientos", nombre: "Alisado japonés",                   precio: 2000, costo: c(2000), duracionMinutos: 240, descripcion: "Alisado de larga duración" },
  { categoria: "Tratamientos", nombre: "Ondas americanas",                  precio:  600, costo: c( 600), duracionMinutos: 120 },
  { categoria: "Tratamientos", nombre: "Reconstrucción capilar",            precio:  450, costo: c( 450), duracionMinutos:  90 },

  // ─── Uñas (12) ───────────────────────────────────────────────────────────
  { categoria: "Uñas", nombre: "Manicure tradicional",              precio: 120, costo: c(120), duracionMinutos:  45 },
  { categoria: "Uñas", nombre: "Manicure semi-permanente (gel)",    precio: 200, costo: c(200), duracionMinutos:  60 },
  { categoria: "Uñas", nombre: "Pedicure tradicional",              precio: 150, costo: c(150), duracionMinutos:  60 },
  { categoria: "Uñas", nombre: "Pedicure semi-permanente",          precio: 250, costo: c(250), duracionMinutos:  75 },
  { categoria: "Uñas", nombre: "Nail art sencillo",                 precio: 150, costo: c(150), duracionMinutos:  30, descripcion: "Diseño básico por uña" },
  { categoria: "Uñas", nombre: "Nail art elaborado",                precio: 300, costo: c(300), duracionMinutos:  60, descripcion: "Diseño detallado y personalizado" },
  { categoria: "Uñas", nombre: "Uñas acrílicas (colocación)",       precio: 400, costo: c(400), duracionMinutos:  90 },
  { categoria: "Uñas", nombre: "Uñas gelish",                       precio: 300, costo: c(300), duracionMinutos:  75 },
  { categoria: "Uñas", nombre: "Retiro de uñas acrílicas",          precio: 150, costo: c(150), duracionMinutos:  45 },
  { categoria: "Uñas", nombre: "French tradicional",                precio: 180, costo: c(180), duracionMinutos:  60 },
  { categoria: "Uñas", nombre: "Manicure + Pedicure (paquete)",     precio: 280, costo: c(280), duracionMinutos:  90 },
  { categoria: "Uñas", nombre: "Spa de manos y pies",               precio: 350, costo: c(350), duracionMinutos:  90, descripcion: "Exfoliación, masaje e hidratación" },

  // ─── Maquillaje (8) ──────────────────────────────────────────────────────
  { categoria: "Maquillaje", nombre: "Maquillaje natural / día",            precio:  350, costo: c( 350), duracionMinutos:  60 },
  { categoria: "Maquillaje", nombre: "Maquillaje noche / evento",           precio:  450, costo: c( 450), duracionMinutos:  75 },
  { categoria: "Maquillaje", nombre: "Maquillaje artístico",                precio:  500, costo: c( 500), duracionMinutos:  90 },
  { categoria: "Maquillaje", nombre: "Maquillaje para sesión fotográfica",  precio:  500, costo: c( 500), duracionMinutos:  90 },
  { categoria: "Maquillaje", nombre: "Prueba de maquillaje",                precio:  300, costo: c( 300), duracionMinutos:  60 },
  { categoria: "Maquillaje", nombre: "Maquillaje + Peinado (evento)",       precio:  800, costo: c( 800), duracionMinutos: 150 },
  { categoria: "Maquillaje", nombre: "Micropigmentación de cejas",          precio: 2500, costo: c(2500), duracionMinutos: 120, descripcion: "Técnica de maquillaje semipermanente" },
  { categoria: "Maquillaje", nombre: "Delineado permanente",                precio: 2000, costo: c(2000), duracionMinutos:  90 },

  // ─── Spa (8) ─────────────────────────────────────────────────────────────
  { categoria: "Spa", nombre: "Masaje relajante (30 min)", precio: 200, costo: c(200), duracionMinutos:  30 },
  { categoria: "Spa", nombre: "Masaje relajante (60 min)", precio: 350, costo: c(350), duracionMinutos:  60 },
  { categoria: "Spa", nombre: "Limpieza facial básica",    precio: 280, costo: c(280), duracionMinutos:  60 },
  { categoria: "Spa", nombre: "Facial anti-age",           precio: 450, costo: c(450), duracionMinutos:  75, descripcion: "Tratamiento facial con activos rejuvenecedores" },
  { categoria: "Spa", nombre: "Exfoliación corporal",      precio: 350, costo: c(350), duracionMinutos:  60 },
  { categoria: "Spa", nombre: "Aromaterapia (60 min)",     precio: 400, costo: c(400), duracionMinutos:  60 },
  { categoria: "Spa", nombre: "Spa de pies",               precio: 200, costo: c(200), duracionMinutos:  45 },
  { categoria: "Spa", nombre: "Reflexología podal",        precio: 250, costo: c(250), duracionMinutos:  45 },

  // ─── Depilación (12) ─────────────────────────────────────────────────────
  { categoria: "Depilación", nombre: "Depilación labio superior",       precio:  80, costo: c( 80), duracionMinutos: 10 },
  { categoria: "Depilación", nombre: "Depilación de cejas (cera)",      precio: 100, costo: c(100), duracionMinutos: 15 },
  { categoria: "Depilación", nombre: "Diseño de cejas",                 precio: 150, costo: c(150), duracionMinutos: 20, descripcion: "Diseño y definición de cejas" },
  { categoria: "Depilación", nombre: "Depilación de axilas",            precio: 120, costo: c(120), duracionMinutos: 15 },
  { categoria: "Depilación", nombre: "Depilación de brazos",            precio: 180, costo: c(180), duracionMinutos: 30 },
  { categoria: "Depilación", nombre: "Depilación piernas completas",    precio: 300, costo: c(300), duracionMinutos: 45 },
  { categoria: "Depilación", nombre: "Depilación media pierna",         precio: 200, costo: c(200), duracionMinutos: 30 },
  { categoria: "Depilación", nombre: "Depilación bikini clásico",       precio: 200, costo: c(200), duracionMinutos: 20 },
  { categoria: "Depilación", nombre: "Depilación bikini brasileño",     precio: 280, costo: c(280), duracionMinutos: 30 },
  { categoria: "Depilación", nombre: "Depilación de espalda",           precio: 200, costo: c(200), duracionMinutos: 30 },
  { categoria: "Depilación", nombre: "Depilación de pecho (caballero)", precio: 200, costo: c(200), duracionMinutos: 30 },
  { categoria: "Depilación", nombre: "Threading de cejas",              precio: 120, costo: c(120), duracionMinutos: 15, descripcion: "Depilación con hilo" },

  // ─── Novias (8) ──────────────────────────────────────────────────────────
  { categoria: "Novias", nombre: "Peinado de novia",                       precio: 1500, costo: c(1500), duracionMinutos: 180 },
  { categoria: "Novias", nombre: "Maquillaje de novia",                    precio: 1800, costo: c(1800), duracionMinutos: 150 },
  { categoria: "Novias", nombre: "Prueba de peinado novia",                precio:  800, costo: c( 800), duracionMinutos: 120 },
  { categoria: "Novias", nombre: "Prueba de maquillaje novia",             precio:  800, costo: c( 800), duracionMinutos:  90 },
  { categoria: "Novias", nombre: "Paquete novia (peinado + maquillaje)",   precio: 2500, costo: c(2500), duracionMinutos: 300, descripcion: "Peinado y maquillaje completo para el gran día" },
  { categoria: "Novias", nombre: "Peinado dama de honor",                  precio:  800, costo: c( 800), duracionMinutos:  90 },
  { categoria: "Novias", nombre: "Maquillaje dama de honor",               precio:  800, costo: c( 800), duracionMinutos:  75 },
  { categoria: "Novias", nombre: "Paquete madre de la novia",              precio: 1800, costo: c(1800), duracionMinutos: 180, descripcion: "Peinado y maquillaje para la madre de la novia" },
]

async function main() {
  console.log(`\n🌱 Iniciando seed — ${SERVICIOS.length} servicios...\n`)

  // Evitar duplicados: borrar existentes con el mismo nombre
  const existentes = await prisma.servicio.count()
  if (existentes > 0) {
    console.log(`⚠️  Ya existen ${existentes} servicios. Eliminando para re-sembrar...`)
    await prisma.servicio.deleteMany()
  }

  const result = await prisma.servicio.createMany({
    data: SERVICIOS.map((s) => ({
      nombre:          s.nombre,
      descripcion:     s.descripcion ?? null,
      precio:          s.precio,
      costo:           s.costo,
      duracionMinutos: s.duracionMinutos,
      categoria:       s.categoria,
      activo:          true,
    })),
    skipDuplicates: true,
  })

  console.log(`✅ ${result.count} servicios creados`)

  // Resumen por categoría
  const resumen = SERVICIOS.reduce<Record<string, number>>((acc, s) => {
    acc[s.categoria] = (acc[s.categoria] ?? 0) + 1
    return acc
  }, {})

  console.log("\n📊 Resumen por categoría:")
  Object.entries(resumen).forEach(([cat, n]) =>
    console.log(`   ${cat.padEnd(14)} ${n} servicios`),
  )
  console.log("")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); await pool.end() })
