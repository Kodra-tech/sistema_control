import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Rutas que solo puede ver rol distinto a 'empleado' (dueno / admin)
const ADMIN_ONLY_ROUTES = ["/reportes", "/configuracion", "/compras"]

const STATIC_ASSET = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|css|map)$/

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 1. Assets estáticos y rutas internas de Next.js ──────────────────────
  if (pathname.startsWith("/_next/") || STATIC_ASSET.test(pathname)) {
    return NextResponse.next()
  }

  // ── 2. Crear cliente Supabase con cookie refresh ──────────────────────────
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser refresca el token si venció — NUNCA usar getSession() aquí
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute = pathname === "/login"

  // ── 3. Protección básica de autenticación ─────────────────────────────────
  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  // ── 4. Protección por rol (rutas de solo administrador / dueño) ───────────
  if (user && ADMIN_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", user.id)
      .single()

    // 'empleado' no puede acceder; cualquier otro rol (dueno / admin) sí
    if (perfil?.rol === "empleado") {
      const url = request.nextUrl.clone()
      url.pathname = "/"
      return NextResponse.redirect(url)
    }
  }

  return response
}
