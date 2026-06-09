import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const SALON_NAME  = process.env.NEXT_PUBLIC_SALON_NAME ?? "Salón"
const FROM_EMAIL  = process.env.RESEND_FROM_EMAIL ?? "noreply@example.com"

interface CitaEmailData {
  fecha: string
  hora:  string
  notas: string | null
}

interface ClienteEmailData {
  nombre:   string
  apellido?: string | null
  email:    string
}

interface ServicioEmailData {
  nombre: string
  precio: unknown
}

export async function sendConfirmacionCita(
  cita:     CitaEmailData,
  cliente:  ClienteEmailData,
  servicio: ServicioEmailData,
): Promise<void> {
  const nombreCompleto = [cliente.nombre, cliente.apellido].filter(Boolean).join(" ")
  const precioFmt      = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(servicio.precio))

  const [anio, mes, dia] = cita.fecha.split("-")
  const fechaFmt = `${dia}/${mes}/${anio}`

  await resend.emails.send({
    from:    `${SALON_NAME} <${FROM_EMAIL}>`,
    to:      cliente.email,
    subject: `Confirmación de cita — ${SALON_NAME}`,
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.1)">
    <h2 style="margin:0 0 8px;color:#111827">${SALON_NAME}</h2>
    <p style="color:#6b7280;margin:0 0 24px">Confirmación de tu cita</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px">
    <p style="margin:0 0 16px;color:#111827">Hola <strong>${nombreCompleto}</strong>,</p>
    <p style="margin:0 0 24px;color:#374151">Tu cita ha sido registrada exitosamente. Te esperamos.</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 24px">
      <tr>
        <td style="padding:8px 0;color:#6b7280;font-size:14px">Servicio</td>
        <td style="padding:8px 0;color:#111827;font-weight:600;text-align:right">${servicio.nombre}</td>
      </tr>
      <tr style="background:#f9fafb">
        <td style="padding:8px 6px;color:#6b7280;font-size:14px">Fecha</td>
        <td style="padding:8px 6px;color:#111827;text-align:right">${fechaFmt}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6b7280;font-size:14px">Hora</td>
        <td style="padding:8px 0;color:#111827;text-align:right">${cita.hora}</td>
      </tr>
      <tr style="background:#f9fafb">
        <td style="padding:8px 6px;color:#6b7280;font-size:14px">Precio</td>
        <td style="padding:8px 6px;color:#111827;font-weight:600;text-align:right">${precioFmt}</td>
      </tr>
      ${cita.notas ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Notas</td><td style="padding:8px 0;color:#374151;text-align:right">${cita.notas}</td></tr>` : ""}
    </table>
    <p style="color:#6b7280;font-size:13px;margin:0">Si necesitas cancelar o reprogramar, contáctanos con anticipación.</p>
  </div>
</body>
</html>`,
  })
}
