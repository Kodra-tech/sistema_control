import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const nombreUsuario = user?.email?.split("@")[0] ?? ""

  // Obtener nombre del salón para el Header (falla silenciosa si no hay config aún)
  let nombreSalon = "Salón Control"
  try {
    const { data: config } = await supabase
      .from("configuracion")
      .select("nombre_salon")
      .limit(1)
      .maybeSingle()
    if (config?.nombre_salon) nombreSalon = config.nombre_salon
  } catch {
    // tabla puede no existir todavía en el primer despliegue
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header nombreSalon={nombreSalon} nombreUsuario={nombreUsuario} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
