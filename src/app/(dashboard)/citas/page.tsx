import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CitaCalendar } from "@/components/citas/CitaCalendarWrapper"
import { CitaFormTrigger } from "@/components/citas/CitaFormTrigger"

export default async function CitasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground text-sm">Gestión de citas y calendario</p>
        </div>
        <CitaFormTrigger />
      </div>

      <CitaCalendar />
    </div>
  )
}
