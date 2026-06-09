import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { VentaForm } from "@/components/ventas/VentaForm"

export default async function NuevaVentaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nueva venta</h1>
        <p className="text-muted-foreground text-sm">Registra un servicio o producto vendido</p>
      </div>
      <VentaForm />
    </div>
  )
}
