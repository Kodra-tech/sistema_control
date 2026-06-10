"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import { formatMXN } from "@/lib/utils/currency"

interface MesData {
  mes_label:      string
  ventas_totales: number
  gastos_totales: number
  utilidad_neta:  number
}

interface VentasMensualesChartProps {
  data: MesData[]
}

interface TooltipPayload {
  name:  string
  value: number
  color: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg text-sm space-y-1.5">
      <p className="font-medium text-foreground">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between gap-8">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-medium">{formatMXN(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function VentasMensualesChart({ data }: VentasMensualesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="mes_label"
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          width={50}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(v: string) => <span style={{ color: "var(--foreground)" }}>{v}</span>}
        />
        <Bar dataKey="ventas_totales" name="Ventas"  fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={24} />
        <Bar dataKey="gastos_totales" name="Gastos"  fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={24} />
        <Bar dataKey="utilidad_neta"  name="Utilidad" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  )
}
