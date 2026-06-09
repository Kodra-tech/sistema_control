import {
  LayoutDashboard,
  Users,
  CalendarDays,
  ShoppingCart,
  Receipt,
  Package,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react"

export interface NavLink {
  href: string
  label: string
  icon: LucideIcon
}

export const navLinks: NavLink[] = [
  { href: "/",              label: "Dashboard",     icon: LayoutDashboard },
  { href: "/clientes",      label: "Clientes",      icon: Users },
  { href: "/citas",         label: "Citas",         icon: CalendarDays },
  { href: "/ventas",        label: "Ventas",        icon: ShoppingCart },
  { href: "/gastos",        label: "Gastos",        icon: Receipt },
  { href: "/inventario",    label: "Inventario",    icon: Package },
  { href: "/reportes",      label: "Reportes",      icon: BarChart3 },
  { href: "/configuracion", label: "Configuración", icon: Settings },
]
