"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { CATEGORIAS_INVENTARIO, UNIDADES_INVENTARIO } from "@/lib/constants"
import { NumberInput } from "@/components/shared/NumberInput"
import type { InventarioRow } from "@/components/inventario/InventarioColumns"

const formSchema = z.object({
  codigo:         z.string().max(50).optional(),
  nombre:         z.string().min(2, "Mínimo 2 caracteres"),
  categoria:      z.enum(CATEGORIAS_INVENTARIO),
  unidad:         z.enum(UNIDADES_INVENTARIO),
  stockActual:    z.number().min(0).optional(),
  stockMinimo:    z.number().min(0).optional(),
  precioUnitario: z.number().positive("Requerido"),
  precioVenta:    z.number().positive().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface InventarioFormProps {
  open:          boolean
  onClose:       () => void
  onSuccess:     () => void
  defaultValues?: InventarioRow | null
}

export function InventarioForm({ open, onClose, onSuccess, defaultValues }: InventarioFormProps) {
  const isEditing = !!defaultValues?.id

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codigo:         defaultValues?.codigo         ?? "",
      nombre:         defaultValues?.nombre         ?? "",
      categoria:      (defaultValues?.categoria as (typeof CATEGORIAS_INVENTARIO)[number]) ?? "Otro",
      unidad:         (defaultValues?.unidad as (typeof UNIDADES_INVENTARIO)[number])      ?? "pieza",
      stockActual:    defaultValues ? Number(defaultValues.stockActual) : undefined,
      stockMinimo:    defaultValues ? Number(defaultValues.stockMinimo) : undefined,
      precioUnitario: defaultValues ? Number(defaultValues.precioUnitario) : undefined,
      precioVenta:    defaultValues?.precioVenta ? Number(defaultValues.precioVenta) : undefined,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        codigo:         defaultValues?.codigo         ?? "",
        nombre:         defaultValues?.nombre         ?? "",
        categoria:      (defaultValues?.categoria as (typeof CATEGORIAS_INVENTARIO)[number]) ?? "Otro",
        unidad:         (defaultValues?.unidad as (typeof UNIDADES_INVENTARIO)[number])      ?? "pieza",
        stockActual:    defaultValues ? Number(defaultValues.stockActual) : undefined,
        stockMinimo:    defaultValues ? Number(defaultValues.stockMinimo) : undefined,
        precioUnitario: defaultValues ? Number(defaultValues.precioUnitario) : undefined,
        precioVenta:    defaultValues?.precioVenta ? Number(defaultValues.precioVenta) : undefined,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function onSubmit(values: FormValues) {
    const body = {
      ...values,
      stockActual: values.stockActual ?? 0,
      stockMinimo: values.stockMinimo ?? 0,
    }
    const url    = isEditing ? `/api/inventario/${defaultValues!.id}` : "/api/inventario"
    const method = isEditing ? "PATCH" : "POST"
    const res    = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(data.error ?? "Error al guardar")
      return
    }
    toast.success(isEditing ? "Producto actualizado" : "Producto creado")
    onSuccess()
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{isEditing ? "Editar producto" : "Nuevo producto"}</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="codigo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Código / SKU</FormLabel>
                  <FormControl><Input placeholder="Opcional" {...field} value={field.value ?? ""} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="nombre" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="categoria" render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {CATEGORIAS_INVENTARIO.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="unidad" render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidad</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {UNIDADES_INVENTARIO.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="stockActual" render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock actual</FormLabel>
                  <FormControl>
                    <NumberInput
                      value={field.value}
                      onChange={(v) => field.onChange(v ?? 0)}
                      step="1"
                      min={0}
                      allowZero
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="stockMinimo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock mínimo</FormLabel>
                  <FormControl>
                    <NumberInput
                      value={field.value}
                      onChange={(v) => field.onChange(v ?? 0)}
                      step="1"
                      min={0}
                      allowZero
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="precioUnitario" render={({ field }) => (
                <FormItem>
                  <FormLabel>Costo unitario</FormLabel>
                  <FormControl>
                    <NumberInput value={field.value} onChange={field.onChange} prefix="$" step="0.01" min={0.01} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="precioVenta" render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio venta</FormLabel>
                  <FormControl>
                    <NumberInput
                      value={field.value}
                      onChange={(v) => field.onChange(v ?? undefined)}
                      prefix="$"
                      step="0.01"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
              <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Guardando…" : isEditing ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
