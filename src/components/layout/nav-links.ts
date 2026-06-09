import {
  LayoutDashboard,
  Users,
  CalendarDays,
  ShoppingCart,
  Receipt,
  Package,
  Truck,
  BarChart3,
  Settings,
  Scissors,
  type LucideIcon,
} from "lucide-react"

export interface NavLink {
  href:       string
  label:      string
  icon:       LucideIcon
  adminOnly?: boolean
}

export const navLinks: NavLink[] = [
  { href: "/",              label: "Dashboard",    icon: LayoutDashboard },
  { href: "/clientes",      label: "Clientes",     icon: Users            },
  { href: "/citas",         label: "Agenda",       icon: CalendarDays     },
  { href: "/ventas",        label: "Ventas",       icon: ShoppingCart     },
  { href: "/gastos",        label: "Gastos",       icon: Receipt          },
  { href: "/servicios",     label: "Servicios",    icon: Scissors         },
  { href: "/inventario",    label: "Inventario",   icon: Package,          adminOnly: true },
  { href: "/compras",       label: "Compras",      icon: Truck,            adminOnly: true },
  { href: "/reportes",      label: "Reportes",     icon: BarChart3,        adminOnly: true },
  { href: "/configuracion", label: "Configuración",icon: Settings,         adminOnly: true },
]
