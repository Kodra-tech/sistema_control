"use client"

import { useEffect, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { clienteSchema, type ClienteInput } from "@/lib/validations/clientes"
import type { Cliente } from "@/generated/prisma/client"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface ClienteSheetProps {
  open:          boolean
  onOpenChange:  (open: boolean) => void
  cliente?:      Cliente | null
  onCreate:      (data: ClienteInput) => Promise<unknown>
  onUpdate:      (id: string, data: ClienteInput) => Promise<unknown>
}

export function ClienteSheet({
  open,
  onOpenChange,
  cliente,
  onCreate,
  onUpdate,
}: ClienteSheetProps) {
  const isEditing = !!cliente
  const [isPending, startTransition] = useTransition()

  const form = useForm<ClienteInput>({
    resolver: zodResolver(clienteSchema),
    defaultValues: { nombre: "", telefono: "", email: "", notas: "" },
  })

  // Prellenar con datos del cliente al editar
  useEffect(() => {
    if (cliente) {
      form.reset({
        nombre:   cliente.nombre,
        telefono: cliente.telefono ?? "",
        email:    cliente.email    ?? "",
        notas:    cliente.notas    ?? "",
      })
    } else {
      form.reset({ nombre: "", telefono: "", email: "", notas: "" })
    }
  }, [cliente, form])

  function onSubmit(values: ClienteInput) {
    startTransition(async () => {
      try {
        if (isEditing && cliente) {
          await onUpdate(cliente.id, values)
          toast.success("Cliente actualizado correctamente")
        } else {
          await onCreate(values)
          toast.success("Cliente creado correctamente")
        }
        onOpenChange(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error inesperado")
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Editar cliente" : "Nuevo cliente"}</SheetTitle>
          <SheetDescription>
            {isEditing ? "Modifica los datos del cliente" : "Completa los datos para registrar un nuevo cliente"}
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 gap-4 py-4 overflow-y-auto"
          >
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre completo" disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="55 1234 5678"
                      type="tel"
                      disabled={isPending}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="correo@ejemplo.com"
                      type="email"
                      disabled={isPending}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Preferencias, alergias, observaciones…"
                      className="resize-none"
                      rows={3}
                      disabled={isPending}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end mt-auto pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEditing ? "Guardando…" : "Creando…"
                  : isEditing ? "Guardar cambios" : "Crear cliente"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
