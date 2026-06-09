"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Scissors } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { navLinks } from "./nav-links"

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Cerrar el Sheet cuando la ruta cambia (ej: botón atrás del browser)
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <SheetHeader className="flex h-16 flex-row items-center gap-2 border-b px-6 space-y-0">
            <Scissors className="h-5 w-5 text-primary" />
            <SheetTitle className="text-sm font-semibold tracking-tight">
              Salón Control
            </SheetTitle>
          </SheetHeader>

          <nav className="p-3 space-y-0.5">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
