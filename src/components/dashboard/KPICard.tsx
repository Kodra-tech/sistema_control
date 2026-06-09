import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface KPICardProps {
  title:          string
  value:          number
  prefix?:        string
  suffix?:        string
  previousValue?: number
  loading?:       boolean
  description?:   string
  formatFn?:      (v: number) => string
}

function defaultFmt(prefix: string | undefined, suffix: string | undefined) {
  return (v: number) => `${prefix ?? ""}${v.toLocaleString("es-MX", { maximumFractionDigits: 2 })}${suffix ?? ""}`
}

export function KPICard({
  title, value, prefix, suffix, previousValue, loading, description, formatFn,
}: KPICardProps) {
  const fmt = formatFn ?? defaultFmt(prefix, suffix)

  if (loading) {
    return (
      <Card>
        <CardContent className="p-5 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    )
  }

  let trend: "up" | "down" | "flat" = "flat"
  let trendPct = 0

  if (previousValue !== undefined && previousValue !== 0) {
    const delta = value - previousValue
    trendPct    = Math.abs((delta / Math.abs(previousValue)) * 100)
    trend       = delta > 0 ? "up" : delta < 0 ? "down" : "flat"
  }

  const trendColor = trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-muted-foreground"
  const TrendIcon  = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold mt-1 tracking-tight">{fmt(value)}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        {previousValue !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${trendColor}`}>
            <TrendIcon className="h-3.5 w-3.5" />
            <span>
              {trend === "flat"
                ? "Sin cambio"
                : `${trendPct.toFixed(1)}% vs mes anterior`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
