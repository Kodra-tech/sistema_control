import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DocumentosForm } from "@/components/documentos/DocumentosForm"

export default async function DocumentosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documentos</h1>
        <p className="text-muted-foreground text-sm">Genera cotizaciones y notas de venta en PDF</p>
      </div>
      <DocumentosForm />
    </div>
  )
}
