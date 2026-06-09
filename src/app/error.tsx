"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[AppError]", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Algo salió mal</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          {error.message || "Ocurrió un error inesperado. Por favor intenta de nuevo."}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60">Código: {error.digest}</p>
        )}
      </div>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  )
}
