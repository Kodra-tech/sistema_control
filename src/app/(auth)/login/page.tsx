"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Scissors } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { loginAction } from "@/actions/auth"

const schema = z.object({
  email:    z.string().email("Ingresa un email válido"),
  password: z.string().min(1, "La contraseña es requerida"),
})

type FormData = z.infer<typeof schema>

function toSpanish(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes("invalid login credentials")) return "Email o contraseña incorrectos"
  if (m.includes("email not confirmed"))       return "Confirma tu email antes de continuar"
  if (m.includes("too many requests"))         return "Demasiados intentos. Espera unos minutos"
  if (m.includes("user not found"))            return "No existe una cuenta con ese email"
  return "Error al iniciar sesión. Intenta de nuevo"
}

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  })

  const rootError = form.formState.errors.root?.message

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const result = await loginAction(data.email, data.password)
      if (result.error) {
        form.setError("root", { message: toSpanish(result.error) })
        return
      }
      router.push("/")
      router.refresh()
    })
  }

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader className="space-y-3 text-center pb-4">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Scissors className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div>
          <CardTitle className="text-xl">Salón Control</CardTitle>
          <CardDescription className="mt-1">
            Ingresa tus credenciales para acceder
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {rootError && (
              <Alert variant="destructive" className="py-2">
                <AlertDescription className="text-sm">{rootError}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      autoComplete="email"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Iniciando sesión…" : "Iniciar sesión"}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="justify-center pt-0">
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
          onClick={() => {
            // TODO Sprint S1: forgot-password flow
          }}
        >
          ¿Olvidaste tu contraseña?
        </button>
      </CardFooter>
    </Card>
  )
}
