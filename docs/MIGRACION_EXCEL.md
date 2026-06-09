# Guía de Migración desde Excel

Esta guía explica cómo importar los datos históricos desde el archivo Excel `Sistema_Control_v5_1.xlsm` al nuevo sistema.

## Prerrequisitos

- Node.js >= 18 instalado
- Variables de entorno configuradas en `.env.local`
- Servidor de base de datos accesible (Supabase)
- El archivo Excel en la raíz del proyecto o en una ruta accesible

## Pasos

### 1. Ubicar el archivo Excel

Coloca el archivo `.xlsm` en la raíz del proyecto o anota su ruta completa:

```
D:\Documentos\Sistema_Control_v5_1.xlsm
```

### 2. Ejecutar el script de importación

```bash
# Desde la raíz del proyecto
npm run import:excel

# O con ruta explícita
npx tsx src/scripts/import-excel.ts ./Sistema_Control_v5_1.xlsm
```

El script importa en este orden:
1. **Clientes** — nombre, apellido, teléfono, email
2. **Servicios** — nombre, precio, duración, categoría
3. **Ventas históricas** — concepto, monto, fecha, método de pago
4. **Gastos históricos** — concepto, monto, categoría, fecha

### 3. Verificar los datos importados

```bash
npm run db:studio
```

Abre Prisma Studio en [http://localhost:5555](http://localhost:5555) para revisar visualmente los registros importados.

También puedes verificar desde el sistema en:
- `/clientes` — listado de clientes importados
- `/ventas` — historial de ventas con filtro por mes
- `/gastos` — historial de gastos por categoría

## Estructura esperada del Excel

El script mapea las siguientes hojas y columnas:

| Hoja Excel | Tabla DB | Columnas esperadas |
|-----------|----------|--------------------|
| `Clientes` | `clientes` | Nombre, Apellido, Teléfono, Email |
| `Servicios` | `servicios` | Nombre, Precio, Duración (min), Categoría |
| `Ventas` | `ventas` | Fecha, Concepto, Monto, Método de pago |
| `Gastos` | `gastos` | Fecha, Concepto, Monto, Categoría |

## Errores comunes

### Error: "Columna 'Nombre' no encontrada"

El script no encontró la columna esperada. Verifica que los encabezados del Excel coincidan con los nombres listados arriba. El mapeo es sensible a mayúsculas.

**Solución:** Edita `src/scripts/import-excel.ts` y ajusta los nombres de columna en el mapa `COLUMN_MAP`.

### Error: "Fecha inválida"

La columna de fecha tiene un formato no reconocido.

**Solución:** El script acepta fechas en formato `DD/MM/YYYY` y `YYYY-MM-DD`. Convierte la columna en Excel a texto en ese formato antes de importar.

### Error: "Monto negativo"

Algunos registros tienen montos negativos (posibles notas de crédito).

**Comportamiento:** El script omite estos registros y los reporta en consola. Revisa el log de salida.

### Error de duplicados

Si ejecutas el script dos veces, pueden crearse registros duplicados.

**Solución:** El script usa `upsert` donde es posible (clientes y servicios por nombre). Para ventas y gastos, borra los registros del período antes de reimportar:

```sql
-- Ejecutar en Supabase SQL Editor antes de reimportar
DELETE FROM ventas WHERE fecha < '2025-01-01';
DELETE FROM gastos WHERE fecha < '2025-01-01';
```

## Después de la importación

1. Revisa los datos en `/reportes` para confirmar que los totales históricos coinciden con el Excel
2. Verifica las citas pendientes (si las hay en el Excel) desde `/citas`
3. Configura los datos del salón en `/configuracion`
4. Crea la cuenta del dueño y empleados desde `/configuracion/usuarios`
