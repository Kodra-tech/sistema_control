"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { LogOut, User } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MobileNav } from "./MobileNav"
import { logoutAction } from "@/actions/auth"

interface HeaderProps {
  nombreSalon?: string
  nombreUsuario?: string
}

export function Header({
  nombreSalon = "Salón Control",
  nombreUsuario = "",
}: HeaderProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await logoutAction()
      router.push("/login")
      router.refresh()
    })
  }

  const initials = nombreUsuario
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="flex h-16 shrink-0 items-center border-b bg-card px-4 gap-3">
      <MobileNav />

      <p className="flex-1 text-sm font-medium truncate">{nombreSalon}</p>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full" disabled={isPending}>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {initials || <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          {nombreUsuario && (
            <>
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium truncate">{nombreUsuario}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            onClick={handleLogout}
            disabled={isPending}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isPending ? "Cerrando sesión…" : "Cerrar sesión"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
