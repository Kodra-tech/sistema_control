# Salón Control

Sistema de control financiero para salón de belleza. Migración de Excel VBA a una aplicación web moderna con Next.js 16, Supabase y Vercel.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16.2.7 App Router + TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| State | Zustand + React Hook Form + Zod |
| Tablas | TanStack Table v8 |
| Gráficas | Recharts |
| Calendario | FullCalendar |
| DB | Supabase (PostgreSQL) + Prisma ORM v7 |
| Cache | Upstash Redis |
| Auth | Supabase Auth |
| Email | Resend |
| PDF | @react-pdf/renderer |
| Deploy | Vercel |

## Módulos

- **Dashboard** — KPIs, gráfica de ventas vs gastos 12 meses, top servicios, alertas de stock
- **Clientes** — CRUD completo con búsqueda y paginación
- **Agenda** — Calendario FullCalendar con drag & drop, Realtime via Supabase
- **Ventas** — Registro de servicios y productos, descuentos, CSV export
- **Gastos** — Registro por categoría, gráfica donut, CSV export
- **Inventario** — Stock con alertas de mínimo
- **Compras** — Registro de compras con actualización automática de stock
- **Reportes** — Resumen semanal, por tipo, por método de pago, anual
- **Documentos** — PDFs de cotizaciones y notas de venta con @react-pdf/renderer
- **Configuración** — Datos del salón + gestión de usuarios (roles, invitaciones)

## Prerrequisitos

- Node.js >= 18
- Cuenta en [Supabase](https://supabase.com) (Free tier válido)
- Cuenta en [Upstash](https://upstash.com) (Redis, Free tier válido)
- Cuenta en [Resend](https://resend.com) (email, Free tier válido)
- Cuenta en [Vercel](https://vercel.com)

## Setup local

```bash
# 1. Clonar e instalar dependencias
git clone <repo-url>
cd salon-control
npm install

# 2. Copiar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 3. Sincronizar el schema con la base de datos
npm run db:push

# 4. Cargar datos iniciales (servicios, configuración)
npm run db:seed

# 5. Ejecutar migraciones SQL manualmente en Supabase SQL Editor:
#    - supabase/migrations/004_citas_realtime.sql
#    - supabase/migrations/005_vender_producto_rpc.sql
#    - supabase/migrations/006_resumen_mensual_view.sql
#    - supabase/migrations/007_rls_policies.sql

# 6. Iniciar servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Variables de entorno

```env
# Supabase — en tu proyecto: Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # Solo servidor — NO exponer al cliente

# Base de datos
DATABASE_URL=postgresql://...@...supabase.co:6543/postgres?pgbouncer=true    # Pooler (runtime)
DIRECT_URL=postgresql://...@...supabase.co:5432/postgres                      # Directo (migraciones)

# Upstash Redis — en tu dashboard de Upstash
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=<token>

# Resend — en tu dashboard de Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@tusalon.com

# Nombre del salón (para emails y PDFs)
NEXT_PUBLIC_SALON_NAME=Mi Salón de Belleza
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción local |
| `npm run db:push` | Sincronizar schema Prisma → Supabase |
| `npm run db:seed` | Cargar datos iniciales |
| `npm run db:studio` | Abrir Prisma Studio |
| `npm run import:excel` | Importar datos desde Excel .xlsm |
| `npm test` | Tests unitarios (Vitest) |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:e2e` | Tests E2E (Playwright) |
| `npm run lint` | ESLint |

## Tests

### Unitarios (Vitest)

```bash
npm test
```

Los tests unitarios no requieren conexión a base de datos. Prueban:
- Schemas de validación Zod
- Utilidades (`formatMXN`, detección de conflictos de horario, márgenes)
- Lógica de conversión de citas a ventas
- Cache helper (`withCache`, `invalidateCache`) con Redis mockeado

### E2E (Playwright)

```bash
# Requiere servidor corriendo en :3000 y credenciales de prueba
E2E_EMAIL=dueno@salon.test E2E_PASSWORD=password123 npm run test:e2e
```

## Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/              # Login
│   ├── (dashboard)/         # Páginas protegidas (sidebar + header)
│   │   ├── page.tsx         # Dashboard
│   │   ├── clientes/
│   │   ├── citas/           # Agenda
│   │   ├── ventas/
│   │   ├── gastos/
│   │   ├── servicios/
│   │   ├── inventario/
│   │   ├── compras/
│   │   ├── reportes/
│   │   ├── documentos/
│   │   └── configuracion/
│   └── api/                 # API Routes
├── components/
│   ├── ui/                  # shadcn/ui base
│   ├── layout/              # Sidebar, Header, MobileNav
│   ├── shared/              # DataTable, MonthSelector, skeletons
│   └── <módulo>/            # Componentes por recurso
├── lib/
│   ├── supabase/            # client.ts, server.ts, admin.ts
│   ├── validations/         # Schemas Zod por recurso
│   ├── utils/               # currency.ts, dates.ts, export.ts
│   ├── cache.ts             # withCache + invalidateCache
│   ├── prisma.ts            # Singleton Prisma
│   └── ratelimit.ts         # Rate limiting con Upstash
├── hooks/                   # useClientes, useServicios, etc.
└── proxy.ts                 # Auth guard + rol check (middleware de Next.js 16)
prisma/
├── schema.prisma            # Fuente de verdad del modelo
└── seed.ts                  # Datos iniciales
supabase/
└── migrations/              # SQL para ejecutar manualmente en Supabase
tests/
├── unit/                    # Vitest — lógica pura
└── e2e/                     # Playwright — flujos de usuario
```

## Deploy en Vercel

1. Conectar el repo en [vercel.com](https://vercel.com)
2. Añadir todas las variables de entorno del `.env.example`
3. El build se ejecuta automáticamente (`npm run build`)
4. La región está configurada en `vercel.json` (`iad1`)

## Roles de usuario

| Rol | Permisos |
|-----|----------|
| `dueno` | Acceso completo a todos los módulos |
| `empleado` | Clientes, Agenda, Ventas, Servicios (sin Gastos, Inventario, Compras, Reportes, Configuración) |

Los usuarios inactivos son redirigidos al login automáticamente.
