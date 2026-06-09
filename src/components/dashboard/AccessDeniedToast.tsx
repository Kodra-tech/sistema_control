"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"

export function AccessDeniedToast() {
  const searchParams = useSearchParams()
  const router       = useRouter()

  useEffect(() => {
    if (searchParams.get("error") === "acceso_denegado") {
      toast.error("No tienes permisos para acceder a esa sección")
      router.replace("/")
    }
  }, [searchParams, router])

  return null
}
