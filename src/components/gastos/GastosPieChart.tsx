"use client"

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import { formatMXN } from "@/lib/utils/currency"
import { GASTO_CATEGORIA_COLORES } from "@/lib/constants"

interface PorCategoria {
  categoria: string
  total:     number
}

interface GastosPieChartProps {
  data:         PorCategoria[]
  totalGastos:  number
}

interface TooltipPayload {
  name:  string
  value: number
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{name}</p>
      <p>{formatMXN(value)}</p>
    </div>
  )
}

export function GastosPieChart({ data, totalGastos }: GastosPieChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        Sin gastos en el período
      </div>
    )
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="categoria"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={({ cx, cy, midAngle = 0, outerRadius, value }: { cx: number; cy: number; midAngle?: number; outerRadius: number; value: number }) => {
              const RADIAN = Math.PI / 180
              const radius = outerRadius + 20
              const x = cx + radius * Math.cos(-midAngle * RADIAN)
              const y = cy + radius * Math.sin(-midAngle * RADIAN)
              const pct = totalGastos > 0 ? ((value / totalGastos) * 100).toFixed(0) : "0"
              return (
                <text x={x} y={y} fill="#6b7280" fontSize={11} textAnchor="middle" dominantBaseline="central">
                  {pct}%
                </text>
              )
            }}
          >
            {data.map((entry) => (
              <Cell
                key={entry.categoria}
                fill={GASTO_CATEGORIA_COLORES[entry.categoria] ?? "#9ca3af"}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value: string) => (
              <span className="text-xs">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
