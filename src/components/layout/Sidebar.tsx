"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Scissors } from "lucide-react"
import { cn } from "@/lib/utils"
import { navLinks } from "./nav-links"

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-60 flex-col shrink-0 border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Scissors className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm tracking-tight">Salón Control</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
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
    </aside>
  )
}
