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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { CATEGORIAS_GASTO } from "@/lib/constants"
import type { GastoRow } from "@/components/gastos/GastoColumns"

// ── Schema ────────────────────────────────────────────────────────────────────

const formSchema = z.object({
  concepto:  z.string().min(2, "Mínimo 2 caracteres").max(200),
  monto:     z.number().positive("El monto debe ser mayor a 0"),
  categoria: z.enum(CATEGORIAS_GASTO),
  fecha:     z.string(),
  notas:     z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// ── Props ─────────────────────────────────────────────────────────────────────

interface GastoFormProps {
  open:          boolean
  onClose:       () => void
  onSuccess:     () => void
  defaultValues?: GastoRow | null
}

export function GastoForm({ open, onClose, onSuccess, defaultValues }: GastoFormProps) {
  const isEditing = !!defaultValues?.id
  const today     = new Date().toISOString().split("T")[0]

  const toDateStr = (v: string | Date | undefined | null) => {
    if (!v) return today
    const d = v instanceof Date ? v : new Date(v)
    return d.toISOString().split("T")[0]
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      concepto:  defaultValues?.concepto  ?? "",
      monto:     defaultValues?.monto     ? Number(defaultValues.monto) : undefined,
      categoria: (defaultValues?.categoria as (typeof CATEGORIAS_GASTO)[number]) ?? "Otros",
      fecha:     toDateStr(defaultValues?.fecha),
      notas:     defaultValues?.notas ?? "",
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        concepto:  defaultValues?.concepto  ?? "",
        monto:     defaultValues?.monto     ? Number(defaultValues.monto) : undefined,
        categoria: (defaultValues?.categoria as (typeof CATEGORIAS_GASTO)[number]) ?? "Otros",
        fecha:     toDateStr(defaultValues?.fecha),
        notas:     defaultValues?.notas ?? "",
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function onSubmit(values: FormValues) {
    const url    = isEditing ? `/api/gastos/${defaultValues!.id}` : "/api/gastos"
    const method = isEditing ? "PATCH" : "POST"

    const res  = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(values),
    })
    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      toast.error(data.error ?? "Error al guardar el gasto")
      return
    }

    toast.success(isEditing ? "Gasto actualizado" : "Gasto registrado")
    onSuccess()
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle>{isEditing ? "Editar gasto" : "Nuevo gasto"}</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            <FormField
              control={form.control}
              name="concepto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Concepto</FormLabel>
                  <FormControl>
                    <Input placeholder="Descripción del gasto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="monto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto (MXN)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={field.value === undefined ? "" : field.value}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fecha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIAS_GASTO.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} value={field.value ?? ""} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Guardando…" : isEditing ? "Actualizar" : "Registrar"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
