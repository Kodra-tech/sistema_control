"use client"

import { useEffect, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { clienteSchema, type ClienteInput } from "@/lib/validations/clientes"
import type { Cliente } from "@/generated/prisma/client"
import { createClienteAction, updateClienteAction } from "@/app/(dashboard)/clientes/actions"
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

interface ClienteFormProps {
  open:          boolean
  onClose:       () => void
  defaultValues?: Cliente | null
  onSuccess:     () => void
}

const EMPTY: ClienteInput = {
  nombre: "", apellido: "", telefono: "", email: "", notas: "",
}

export function ClienteForm({ open, onClose, defaultValues, onSuccess }: ClienteFormProps) {
  const isEditing     = !!defaultValues
  const [isPending, startTransition] = useTransition()

  const form = useForm<ClienteInput>({
    resolver: zodResolver(clienteSchema),
    defaultValues: EMPTY,
  })

  useEffect(() => {
    form.reset(
      defaultValues
        ? {
            nombre:   defaultValues.nombre,
            apellido: defaultValues.apellido   ?? "",
            telefono: defaultValues.telefono   ?? "",
            email:    defaultValues.email      ?? "",
            notas:    defaultValues.notas      ?? "",
          }
        : EMPTY,
    )
  }, [defaultValues, form])

  function onSubmit(values: ClienteInput) {
    startTransition(async () => {
      const result = isEditing && defaultValues
        ? await updateClienteAction(defaultValues.id, values)
        : await createClienteAction(values)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(isEditing ? "Cliente actualizado" : "Cliente creado")
      onSuccess()
    })
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{isEditing ? "Editar cliente" : "Nuevo cliente"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Modifica los datos del cliente"
              : "Registra un nuevo cliente en el sistema"}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-y-auto"
          >
            <div className="flex-1 px-6 py-5 space-y-5">
              {/* Nombre + Apellido */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="María" disabled={isPending} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="apellido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="García"
                          disabled={isPending}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Teléfono */}
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="5512345678"
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        disabled={isPending}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
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

              {/* Notas */}
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
            </div>

            <div className="border-t px-6 py-4 flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={onClose}
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
