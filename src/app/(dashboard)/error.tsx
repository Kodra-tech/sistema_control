"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[DashboardError]", error)
  }, [error])

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error al cargar la página</AlertTitle>
          <AlertDescription>
            {error.message || "Ocurrió un error inesperado."}
            {error.digest && (
              <span className="block mt-1 text-xs opacity-60">Ref: {error.digest}</span>
            )}
          </AlertDescription>
        </Alert>
        <Button onClick={reset} className="w-full">
          Reintentar
        </Button>
      </div>
    </div>
  )
}
