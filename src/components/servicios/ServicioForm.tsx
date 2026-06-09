"use client"

import { useEffect, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  servicioSchema,
  CATEGORIAS_SERVICIO,
  type ServicioInput,
} from "@/lib/validations/servicios"
import type { Servicio } from "@/generated/prisma/client"
import { createServicioAction, updateServicioAction } from "@/app/(dashboard)/servicios/actions"
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface Props {
  open:          boolean
  onClose:       () => void
  defaultValues?: Servicio | null
  onSuccess:     () => void
}

const EMPTY: ServicioInput = {
  nombre: "", descripcion: "", precio: 0, costo: null,
  duracion_minutos: 60, categoria: null, activo: true,
}

function NumField({
  value, onChange, placeholder, step = "1", min = "0", disabled,
}: {
  value: number | null | undefined
  onChange: (n: number | null) => void
  placeholder?: string
  step?: string
  min?: string
  disabled?: boolean
}) {
  return (
    <Input
      type="number"
      step={step}
      min={min}
      placeholder={placeholder}
      disabled={disabled}
      value={value === null || value === undefined ? "" : value}
      onChange={(e) => {
        const v = e.target.value
        onChange(v === "" ? null : parseFloat(v) || 0)
      }}
    />
  )
}

export function ServicioForm({ open, onClose, defaultValues, onSuccess }: Props) {
  const isEditing = !!defaultValues
  const [isPending, startTransition] = useTransition()

  const form = useForm<ServicioInput>({
    resolver: zodResolver(servicioSchema),
    defaultValues: EMPTY,
  })

  useEffect(() => {
    form.reset(
      defaultValues
        ? {
            nombre:           defaultValues.nombre,
            descripcion:      defaultValues.descripcion ?? "",
            precio:           Number(defaultValues.precio),
            costo:            defaultValues.costo != null ? Number(defaultValues.costo) : null,
            duracion_minutos: defaultValues.duracionMinutos,
            categoria:        defaultValues.categoria ?? null,
            activo:           defaultValues.activo,
          }
        : EMPTY,
    )
  }, [defaultValues, form])

  function onSubmit(values: ServicioInput) {
    startTransition(async () => {
      const result = isEditing && defaultValues
        ? await updateServicioAction(defaultValues.id, values)
        : await createServicioAction(values)

      if (result.error) { toast.error(result.error); return }
      toast.success(isEditing ? "Servicio actualizado" : "Servicio creado")
      onSuccess()
    })
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{isEditing ? "Editar servicio" : "Nuevo servicio"}</SheetTitle>
          <SheetDescription>
            {isEditing ? "Modifica los datos del servicio" : "Registra un nuevo servicio"}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-y-auto">
            <div className="flex-1 px-6 py-5 space-y-4">

              {/* Nombre */}
              <FormField control={form.control} name="nombre" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input placeholder="Corte dama" disabled={isPending} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Categoría */}
              <FormField control={form.control} name="categoria" render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select
                    disabled={isPending}
                    value={field.value ?? ""}
                    onValueChange={(v) => field.onChange(v || null)}
                  >
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecciona categoría" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIAS_SERVICIO.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Precio + Costo */}
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="precio" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio (MXN) <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <NumField
                        value={field.value}
                        onChange={(v) => field.onChange(v ?? 0)}
                        placeholder="0.00"
                        step="0.01"
                        min="0.01"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="costo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo (MXN)</FormLabel>
                    <FormControl>
                      <NumField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="0.00"
                        step="0.01"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Duración */}
              <FormField control={form.control} name="duracion_minutos" render={({ field }) => (
                <FormItem>
                  <FormLabel>Duración (minutos) <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <NumField
                      value={field.value}
                      onChange={(v) => field.onChange(v ?? 1)}
                      placeholder="60"
                      min="1"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Descripción */}
              <FormField control={form.control} name="descripcion" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción opcional del servicio…"
                      className="resize-none"
                      rows={2}
                      disabled={isPending}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Estado (solo al editar) */}
              {isEditing && (
                <FormField control={form.control} name="activo" render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3">
                      <Switch
                        id="activo-switch"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                      <Label htmlFor="activo-switch" className="cursor-pointer">
                        {field.value ? "Servicio activo" : "Servicio inactivo"}
                      </Label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

            </div>

            <div className="border-t px-6 py-4 flex gap-2 justify-end">
              <Button type="button" variant="outline" disabled={isPending} onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEditing ? "Guardando…" : "Creando…"
                  : isEditing ? "Guardar cambios" : "Crear servicio"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
