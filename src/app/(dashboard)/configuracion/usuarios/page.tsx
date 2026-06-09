import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { UsuariosPanel } from "@/components/configuracion/UsuariosPanel"

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Verificar que el usuario sea admin/dueño
  const perfil = await prisma.perfil.findUnique({
    where: { id: user.id },
    select: { rol: true },
  })
  if (perfil?.rol === "empleado") redirect("/?error=acceso_denegado")

  const perfiles = await prisma.perfil.findMany({
    orderBy: [{ rol: "asc" }, { nombre: "asc" }],
    select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true },
  })

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestión de usuarios</h1>
        <p className="text-muted-foreground text-sm">Administra el acceso al sistema</p>
      </div>
      <UsuariosPanel
        perfiles={perfiles.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }))}
        currentUserId={user.id}
      />
    </div>
  )
}
