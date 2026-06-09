"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

/**
 * Radix UI deja `pointer-events: none` en document.body y elementos de portal
 * huérfanos cuando un Sheet/Dialog/Select/Popover se desmonta durante la
 * navegación de Next.js sin pasar por su propio onOpenChange(false).
 * Este componente se monta en el layout del dashboard y limpia ese estado
 * en cada cambio de ruta.
 */
export function RadixCleanup() {
  const pathname = usePathname()

  useEffect(() => {
    // Restaurar pointer-events (Radix lo pone a "none" cuando hay un modal abierto)
    document.body.style.pointerEvents = ""
    // Radix agrega scroll-lock inline; restaurar por si quedó colgado
    document.body.style.overflow = ""
    document.body.style.paddingRight = ""
    // Eliminar contenedores de portal huérfanos (popover, select, dropdown, tooltip)
    document
      .querySelectorAll("[data-radix-popper-content-wrapper], [data-radix-focus-guard]")
      .forEach((el) => el.remove())
  }, [pathname])

  return null
}
