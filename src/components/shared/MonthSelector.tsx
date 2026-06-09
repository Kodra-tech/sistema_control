"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

interface MonthSelectorProps {
  mes:  number
  anio: number
}

export function MonthSelector({ mes, anio }: MonthSelectorProps) {
  const router      = useRouter()
  const searchParams = useSearchParams()

  function navigate(newMes: number, newAnio: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("mes",  String(newMes))
    params.set("anio", String(newAnio))
    router.push(`?${params.toString()}`)
  }

  function prev() {
    const newMes  = mes === 1 ? 12 : mes - 1
    const newAnio = mes === 1 ? anio - 1 : anio
    navigate(newMes, newAnio)
  }

  function next() {
    const now     = new Date()
    const isNow   = anio === now.getFullYear() && mes === now.getMonth() + 1
    if (isNow) return  // no permitir futuro
    const newMes  = mes === 12 ? 1 : mes + 1
    const newAnio = mes === 12 ? anio + 1 : anio
    navigate(newMes, newAnio)
  }

  const now    = new Date()
  const isFuture = anio > now.getFullYear() || (anio === now.getFullYear() && mes >= now.getMonth() + 1)

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium min-w-[120px] text-center">
        {MESES[mes - 1]} {anio}
      </span>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={next} disabled={isFuture}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
