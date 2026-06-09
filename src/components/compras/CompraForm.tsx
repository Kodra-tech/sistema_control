"use client"

import { useEffect, useState } from "react"
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
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { formatMXN } from "@/lib/utils/currency"

interface ProductoOpt {
  id: string; nombre: string; unidad: string; stockActual: string | number
}

const formSchema = z.object({
  productoId:     z.string().uuid("Selecciona un producto"),
  cantidad:       z.number().positive("Mayor a 0"),
  precioUnitario: z.number().positive("Mayor a 0"),
  proveedor:      z.string().max(100).optional(),
  fecha:          z.string(),
  notas:          z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface CompraFormProps {
  open:      boolean
  onClose:   () => void
  onSuccess: (mensaje: string) => void
}

function NumField({ value, onChange, label }: { value?: number; onChange: (v: number) => void; label: string }) {
  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={value === undefined ? "" : value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
      </FormControl>
    </FormItem>
  )
}

export function CompraForm({ open, onClose, onSuccess }: CompraFormProps) {
  const [productos, setProductos] = useState<ProductoOpt[]>([])
  const today = new Date().toISOString().split("T")[0]

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productoId:     "",
      cantidad:       undefined,
      precioUnitario: undefined,
      proveedor:      "",
      fecha:          today,
      notas:          "",
    },
  })

  const cantidad       = form.watch("cantidad")       ?? 0
  const precioUnitario = form.watch("precioUnitario") ?? 0
  const total          = cantidad * precioUnitario

  useEffect(() => {
    fetch("/api/inventario?activo=true&pageSize=200")
      .then((r) => r.json())
      .then((d) => setProductos(d.data?.items ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!open) form.reset({ productoId: "", fecha: today, proveedor: "", notas: "" })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function onSubmit(values: FormValues) {
    const res  = await fetch("/api/compras", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(values),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(data.error ?? "Error al registrar la compra")
      return
    }
    toast.success("Compra registrada")
    onSuccess(data.mensaje ?? "Stock actualizado")
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Nueva compra</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="productoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Producto</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un producto" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {productos.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombre} — Stock: {Number(p.stockActual)} {p.unidad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="cantidad" render={({ field }) => (
                <NumField label="Cantidad" value={field.value} onChange={field.onChange} />
              )} />
              <FormField control={form.control} name="precioUnitario" render={({ field }) => (
                <NumField label="Costo unitario" value={field.value} onChange={field.onChange} />
              )} />
            </div>

            {/* Preview */}
            {total > 0 && (
              <Card className="bg-muted/40">
                <CardContent className="p-3 flex justify-between text-sm">
                  <span className="text-muted-foreground">Total compra</span>
                  <span className="font-bold">{formatMXN(total)}</span>
                </CardContent>
              </Card>
            )}

            <FormField control={form.control} name="proveedor" render={({ field }) => (
              <FormItem>
                <FormLabel>Proveedor (opcional)</FormLabel>
                <FormControl><Input placeholder="Nombre del proveedor" {...field} value={field.value ?? ""} /></FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="fecha" render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="notas" render={({ field }) => (
              <FormItem>
                <FormLabel>Notas (opcional)</FormLabel>
                <FormControl><Textarea rows={2} {...field} value={field.value ?? ""} /></FormControl>
              </FormItem>
            )} />

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
              <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Guardando…" : "Registrar compra"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
