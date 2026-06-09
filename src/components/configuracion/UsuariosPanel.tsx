"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { UserPlus, Mail } from "lucide-react"

interface Perfil {
  id:        string
  nombre:    string
  email:     string
  rol:       string
  activo:    boolean
  createdAt: string
}

interface UsuariosPanelProps {
  perfiles:      Perfil[]
  currentUserId: string
}

export function UsuariosPanel({ perfiles, currentUserId }: UsuariosPanelProps) {
  const router      = useRouter()
  const [invitarOpen, setInvitarOpen] = useState(false)
  const [nombre,   setNombre]   = useState("")
  const [email,    setEmail]    = useState("")
  const [rol,      setRol]      = useState("empleado")
  const [inviting, setInviting] = useState(false)

  async function handleInvitar() {
    if (!email || !nombre) { toast.error("Completa nombre y email"); return }
    setInviting(true)
    try {
      const res  = await fetch("/api/usuarios/invitar", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, nombre, rol }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? "Error al enviar invitación")
        return
      }
      toast.success(`Invitación enviada a ${email}`)
      setInvitarOpen(false)
      setEmail(""); setNombre("")
      router.refresh()
    } finally {
      setInviting(false)
    }
  }

  async function handleRolChange(id: string, nuevoRol: string) {
    if (id === currentUserId) { toast.error("No puedes cambiar tu propio rol"); return }
    const res = await fetch(`/api/usuarios/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ rol: nuevoRol }),
    })
    if (res.ok) { toast.success("Rol actualizado"); router.refresh() }
    else toast.error("Error al actualizar rol")
  }

  async function handleActivoToggle(id: string, activo: boolean) {
    if (id === currentUserId) { toast.error("No puedes desactivarte a ti mismo"); return }
    const res = await fetch(`/api/usuarios/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ activo: !activo }),
    })
    if (res.ok) {
      toast.success(activo ? "Usuario desactivado" : "Usuario activado")
      router.refresh()
    } else {
      toast.error("Error al actualizar")
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setInvitarOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" /> Invitar usuario
        </Button>
      </div>

      <div className="space-y-3">
        {perfiles.map((p) => (
          <Card key={p.id} className={!p.activo ? "opacity-60" : ""}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{p.nombre}</p>
                  {p.id === currentUserId && (
                    <Badge variant="outline" className="text-xs">Tú</Badge>
                  )}
                  {!p.activo && (
                    <Badge variant="secondary" className="text-xs">Inactivo</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Mail className="h-3 w-3" />
                  <span>{p.email}</span>
                </div>
              </div>

              <Select
                value={p.rol}
                onValueChange={(v) => handleRolChange(p.id, v)}
                disabled={p.id === currentUserId}
              >
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dueno">Dueño</SelectItem>
                  <SelectItem value="empleado">Empleado</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Switch
                  checked={p.activo}
                  onCheckedChange={() => handleActivoToggle(p.id, p.activo)}
                  disabled={p.id === currentUserId}
                />
                <span className="text-xs text-muted-foreground">{p.activo ? "Activo" : "Inactivo"}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={invitarOpen} onOpenChange={setInvitarOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invitar nuevo usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre completo" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <Select value={rol} onValueChange={setRol}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dueno">Dueño</SelectItem>
                  <SelectItem value="empleado">Empleado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvitarOpen(false)}>Cancelar</Button>
            <Button onClick={handleInvitar} disabled={inviting}>
              {inviting ? "Enviando…" : "Enviar invitación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
