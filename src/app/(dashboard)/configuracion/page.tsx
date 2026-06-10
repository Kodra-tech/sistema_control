"use client"

import { useEffect, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { configuracionSchema, type ConfiguracionInput } from "@/lib/validations/configuracion"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Sun, Moon, Monitor } from "lucide-react"

export default function ConfiguracionPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, startSave] = useTransition()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const form = useForm<ConfiguracionInput>({
    resolver: zodResolver(configuracionSchema),
    defaultValues: {
      nombre_salon: "",
      moneda:       "MXN",
      anio_fiscal:  new Date().getFullYear(),
    },
  })

  useEffect(() => {
    fetch("/api/configuracion")
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json()
      })
      .then(({ data }) => {
        if (!data) return
        form.reset({
          nombre_salon: data.nombreSalon  ?? "",
          moneda:       data.moneda        ?? "MXN",
          anio_fiscal:  data.anioFiscal    ?? new Date().getFullYear(),
          telefono:     data.telefono      ?? "",
          email:        data.email         ?? "",
          direccion:    data.direccion     ?? "",
        })
      })
      .catch(() => toast.error("No se pudo cargar la configuración"))
      .finally(() => setIsLoading(false))
  }, [form])

  function onSubmit(values: ConfiguracionInput) {
    startSave(async () => {
      try {
        const res = await fetch("/api/configuracion", {
          method:  "PUT",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(values),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? "Error al guardar")
        }

        toast.success("Configuración guardada correctamente")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error inesperado")
      }
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-1">Datos generales del salón</p>
      </div>

      {/* ── Apariencia ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Apariencia</CardTitle>
          <CardDescription>Elige el tema de color. La preferencia se guarda en este dispositivo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {[
              { value: "light",  label: "Claro",   Icon: Sun     },
              { value: "dark",   label: "Oscuro",  Icon: Moon    },
              { value: "system", label: "Sistema", Icon: Monitor },
            ].map(({ value, label, Icon }) => (
              <Button
                key={value}
                variant={mounted && theme === value ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setTheme(value)}
                disabled={!mounted}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Información del salón ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información del salón</CardTitle>
          <CardDescription>
            Este nombre aparecerá en el encabezado y en los reportes
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

              <FormField
                control={form.control}
                name="nombre_salon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del salón <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      {isLoading ? (
                        <Skeleton className="h-9 w-full" />
                      ) : (
                        <Input
                          placeholder="Ej. Salón Bella Vista"
                          disabled={isSaving}
                          {...field}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="moneda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moneda</FormLabel>
                      <FormControl>
                        {isLoading ? (
                          <Skeleton className="h-9 w-full" />
                        ) : (
                          <Input placeholder="MXN" disabled={isSaving} {...field} />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="anio_fiscal"
                  render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                      <FormLabel>Año fiscal</FormLabel>
                      <FormControl>
                        {isLoading ? (
                          <Skeleton className="h-9 w-full" />
                        ) : (
                          <Input
                            type="number"
                            min={2000}
                            max={2099}
                            placeholder={String(new Date().getFullYear())}
                            disabled={isSaving}
                            value={value ?? ""}
                            onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
                            {...rest}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving || isLoading}>
                  {isSaving ? "Guardando…" : "Guardar cambios"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
