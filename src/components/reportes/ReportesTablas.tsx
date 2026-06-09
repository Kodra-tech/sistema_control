"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { formatMXN } from "@/lib/utils/currency"
import { exportToCSV } from "@/lib/utils/export"

interface SemanaData { label: string; ventas: number; gastos: number; utilidad: number }
interface TipoData   { tipo: string; total: number; count: number; pct: number }
interface MetodoData { metodoPago: string; total: number; count: number; pct: number }
interface AnualData  { mes: number; label: string; ventas: number; gastos: number; utilidad: number }
interface Resumen    { ventas: number; gastos: number; utilidadNeta: number; margen: number }

const MESES_CORTOS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

const METODO_LABEL: Record<string, string> = {
  efectivo: "Efectivo", tarjeta: "Tarjeta", transferencia: "Transferencia", otro: "Otro",
}

interface Props {
  semanas:   SemanaData[]
  porTipo:   TipoData[]
  porMetodo: MetodoData[]
  anual:     AnualData[]
  mes:       number
  anio:      number
  resumen:   Resumen
}

function TablaCuerpo({ rows, keys, totales }: {
  rows:    Record<string, string | number>[]
  keys:    { key: string; label: string; align?: "right" | "left" }[]
  totales?: Record<string, string | number>
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {keys.map((k) => (
              <th key={k.key} className={`pb-2 pt-1 font-medium text-muted-foreground text-xs ${k.align === "right" ? "text-right" : "text-left"}`}>
                {k.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-muted/30">
              {keys.map((k) => (
                <td key={k.key} className={`py-2.5 ${k.align === "right" ? "text-right font-medium" : ""}`}>
                  {row[k.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {totales && (
          <tfoot>
            <tr className="border-t font-bold">
              {keys.map((k) => (
                <td key={k.key} className={`pt-2.5 ${k.align === "right" ? "text-right" : ""}`}>
                  {totales[k.key] ?? ""}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

export function ReportesTablas({ semanas, porTipo, porMetodo, anual, mes, anio, resumen }: Props) {
  function handleExportCSV() {
    const rows = [
      { concepto: "Ventas totales", monto: resumen.ventas.toFixed(2) },
      { concepto: "Gastos totales", monto: resumen.gastos.toFixed(2) },
      { concepto: "Utilidad neta",  monto: resumen.utilidadNeta.toFixed(2) },
      { concepto: "Margen bruto",   monto: `${resumen.margen.toFixed(1)}%` },
    ]
    exportToCSV(
      rows,
      `reporte-${anio}-${String(mes).padStart(2, "0")}`,
      [
        { key: "concepto", header: "Concepto" },
        { key: "monto",    header: "Monto" },
      ],
    )
  }

  // Semanas data
  const semanasRows = semanas.map((s) => ({
    label:   s.label,
    ventas:  formatMXN(s.ventas),
    gastos:  formatMXN(s.gastos),
    utilidad: formatMXN(s.utilidad),
  }))
  const semanasTotal = {
    label:    "TOTAL",
    ventas:   formatMXN(semanas.reduce((a, s) => a + s.ventas, 0)),
    gastos:   formatMXN(semanas.reduce((a, s) => a + s.gastos, 0)),
    utilidad: formatMXN(semanas.reduce((a, s) => a + s.utilidad, 0)),
  }
  const semanasKeys = [
    { key: "label",    label: "Período" },
    { key: "ventas",   label: "Ventas",   align: "right" as const },
    { key: "gastos",   label: "Gastos",   align: "right" as const },
    { key: "utilidad", label: "Utilidad", align: "right" as const },
  ]

  // Tipo data
  const tipoRows = porTipo.map((t) => ({
    tipo:  t.tipo === "servicio" ? "Servicios" : "Productos",
    total: formatMXN(t.total),
    count: String(t.count),
    pct:   `${t.pct.toFixed(1)}%`,
  }))
  const tipoKeys = [
    { key: "tipo",  label: "Tipo" },
    { key: "count", label: "Cant.",  align: "right" as const },
    { key: "total", label: "Total",  align: "right" as const },
    { key: "pct",   label: "% del total", align: "right" as const },
  ]

  // Método pago data
  const metodoRows = porMetodo.map((m) => ({
    metodoPago: METODO_LABEL[m.metodoPago] ?? m.metodoPago,
    total:      formatMXN(m.total),
    count:      String(m.count),
    pct:        `${m.pct.toFixed(1)}%`,
  }))
  const metodoKeys = [
    { key: "metodoPago", label: "Método" },
    { key: "count",      label: "Cant.", align: "right" as const },
    { key: "total",      label: "Total", align: "right" as const },
    { key: "pct",        label: "%",     align: "right" as const },
  ]

  // Anual data
  const anualRows = anual.map((m) => ({
    mes:        `${m.label} ${anio}`,
    ventas:     formatMXN(m.ventas),
    gastos:     formatMXN(m.gastos),
    utilidad:   formatMXN(m.utilidad),
    current:    m.mes === mes,
  }))
  const anualKeys = [
    { key: "mes",      label: "Mes" },
    { key: "ventas",   label: "Ventas",   align: "right" as const },
    { key: "gastos",   label: "Gastos",   align: "right" as const },
    { key: "utilidad", label: "Utilidad", align: "right" as const },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-3.5 w-3.5 mr-1" /> Exportar CSV
        </Button>
      </div>

      <Tabs defaultValue="semanas">
        <TabsList>
          <TabsTrigger value="semanas">Por semana</TabsTrigger>
          <TabsTrigger value="tipo">Por tipo</TabsTrigger>
          <TabsTrigger value="metodo">Por método</TabsTrigger>
          <TabsTrigger value="anual">Acumulado anual</TabsTrigger>
        </TabsList>

        <TabsContent value="semanas">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {MESES_CORTOS[mes - 1]} {anio} — desglose por semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TablaCuerpo rows={semanasRows} keys={semanasKeys} totales={semanasTotal} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tipo">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Servicios vs Productos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TablaCuerpo rows={tipoRows} keys={tipoKeys} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metodo">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Desglose por método de pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TablaCuerpo rows={metodoRows} keys={metodoKeys} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anual">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Comparativa mensual {anio}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {anualKeys.map((k) => (
                        <th key={k.key} className={`pb-2 pt-1 font-medium text-muted-foreground text-xs ${k.align === "right" ? "text-right" : "text-left"}`}>
                          {k.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {anualRows.map((row, i) => (
                      <tr key={i} className={`hover:bg-muted/30 ${row.current ? "bg-primary/5 font-semibold" : ""}`}>
                        {anualKeys.map((k) => (
                          <td key={k.key} className={`py-2.5 ${k.align === "right" ? "text-right" : ""}`}>
                            {(row as Record<string, string | boolean>)[k.key] as string}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
