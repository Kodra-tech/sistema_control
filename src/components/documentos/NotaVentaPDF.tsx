import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

const ACCENT = "#18181b"
const GRAY   = "#71717a"
const LIGHT  = "#f4f4f5"
const GREEN  = "#16a34a"

const styles = StyleSheet.create({
  page:          { fontFamily: "Helvetica", fontSize: 10, color: "#09090b", padding: 40, backgroundColor: "#ffffff" },
  header:        { flexDirection: "row", justifyContent: "space-between", marginBottom: 28, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: ACCENT },
  salonNombre:   { fontSize: 18, fontFamily: "Helvetica-Bold", color: ACCENT },
  salonInfo:     { fontSize: 9, color: GRAY, marginTop: 2 },
  docTitle:      { fontSize: 22, fontFamily: "Helvetica-Bold", color: ACCENT, textAlign: "right" },
  docNum:        { fontSize: 9, color: GRAY, textAlign: "right", marginTop: 2 },
  docFecha:      { fontSize: 9, color: GRAY, textAlign: "right" },
  seccion:       { marginBottom: 16 },
  seccionTitle:  { fontSize: 9, fontFamily: "Helvetica-Bold", color: GRAY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  clienteBox:    { backgroundColor: LIGHT, borderRadius: 4, padding: 10 },
  clienteNombre: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  clienteInfo:   { fontSize: 9, color: GRAY, marginTop: 2 },
  tabla:         { marginTop: 4 },
  tablaHeader:   { flexDirection: "row", backgroundColor: ACCENT, padding: "6 8", borderRadius: 4 },
  tablaHeaderTxt:{ color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 9 },
  tablaRow:      { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: LIGHT, padding: "7 8" },
  tablaRowAlt:   { flexDirection: "row", backgroundColor: LIGHT, padding: "7 8" },
  colDesc:       { flex: 1 },
  colNum:        { width: 50, textAlign: "right" },
  colPrecio:     { width: 70, textAlign: "right" },
  colSub:        { width: 70, textAlign: "right" },
  totalBox:      { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  totalInner:    { width: 200 },
  totalRow:      { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  totalLabel:    { color: GRAY, fontSize: 9 },
  totalValor:    { fontFamily: "Helvetica-Bold", fontSize: 9 },
  totalFinal:    { flexDirection: "row", justifyContent: "space-between", backgroundColor: ACCENT, padding: "8 10", borderRadius: 4, marginTop: 4 },
  totalFinalLbl: { color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 11 },
  totalFinalVal: { color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 11 },
  metodoPago:    { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 4 },
  metodoPagoLbl: { color: GRAY, fontSize: 9 },
  metodoPagoVal: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  stampContainer:{ position: "absolute", top: 120, right: 40 },
  stamp:         { color: GREEN, fontSize: 28, fontFamily: "Helvetica-Bold", borderWidth: 3, borderColor: GREEN, padding: "4 10", borderRadius: 4, transform: "rotate(-15deg)", opacity: 0.9 },
  footer:        { position: "absolute", bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: LIGHT, paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  footerTxt:     { fontSize: 8, color: GRAY },
})

function fmtMXN(v: number): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(v)
}

const METODO_LABEL: Record<string, string> = {
  efectivo: "Efectivo", tarjeta: "Tarjeta / Débito", transferencia: "Transferencia bancaria", otro: "Otro",
}

export interface NotaVentaData {
  folio:     string
  salon:     { nombre: string; telefono?: string | null; email?: string | null }
  cliente?:  { nombre: string; telefono?: string | null; email?: string | null } | null
  servicios: { nombre: string; cantidad: number; precio: number }[]
  descuento?: number
  metodoPago: string
  fecha?:    string
}

export function NotaVentaPDF({ data }: { data: NotaVentaData }) {
  const { folio, salon, cliente, servicios, descuento = 0, metodoPago, fecha } = data
  const subtotal = servicios.reduce((a, s) => a + s.precio * s.cantidad, 0)
  const total    = Math.max(0, subtotal - descuento)
  const fechaStr = fecha ?? new Date().toLocaleDateString("es-MX")

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Stamp PAGADO */}
        <View style={styles.stampContainer}>
          <Text style={styles.stamp}>PAGADO</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.salonNombre}>{salon.nombre}</Text>
            {salon.telefono && <Text style={styles.salonInfo}>{salon.telefono}</Text>}
            {salon.email    && <Text style={styles.salonInfo}>{salon.email}</Text>}
          </View>
          <View>
            <Text style={styles.docTitle}>NOTA DE VENTA</Text>
            <Text style={styles.docNum}>Folio: {folio}</Text>
            <Text style={styles.docFecha}>Fecha: {fechaStr}</Text>
          </View>
        </View>

        {/* Cliente */}
        {cliente && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitle}>Cliente</Text>
            <View style={styles.clienteBox}>
              <Text style={styles.clienteNombre}>{cliente.nombre}</Text>
              {cliente.telefono && <Text style={styles.clienteInfo}>Tel: {cliente.telefono}</Text>}
              {cliente.email    && <Text style={styles.clienteInfo}>{cliente.email}</Text>}
            </View>
          </View>
        )}

        {/* Tabla */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitle}>Detalle</Text>
          <View style={styles.tabla}>
            <View style={styles.tablaHeader}>
              <Text style={[styles.tablaHeaderTxt, styles.colDesc]}>Descripción</Text>
              <Text style={[styles.tablaHeaderTxt, styles.colNum]}>Cant.</Text>
              <Text style={[styles.tablaHeaderTxt, styles.colPrecio]}>Precio</Text>
              <Text style={[styles.tablaHeaderTxt, styles.colSub]}>Subtotal</Text>
            </View>
            {servicios.map((s, i) => (
              <View key={i} style={i % 2 === 0 ? styles.tablaRow : styles.tablaRowAlt}>
                <Text style={styles.colDesc}>{s.nombre}</Text>
                <Text style={styles.colNum}>{s.cantidad}</Text>
                <Text style={styles.colPrecio}>{fmtMXN(s.precio)}</Text>
                <Text style={styles.colSub}>{fmtMXN(s.precio * s.cantidad)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totales */}
        <View style={styles.totalBox}>
          <View style={styles.totalInner}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValor}>{fmtMXN(subtotal)}</Text>
            </View>
            {descuento > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Descuento</Text>
                <Text style={styles.totalValor}>-{fmtMXN(descuento)}</Text>
              </View>
            )}
            <View style={styles.totalFinal}>
              <Text style={styles.totalFinalLbl}>TOTAL</Text>
              <Text style={styles.totalFinalVal}>{fmtMXN(total)}</Text>
            </View>
            <View style={styles.metodoPago}>
              <Text style={styles.metodoPagoLbl}>Forma de pago:</Text>
              <Text style={styles.metodoPagoVal}>{METODO_LABEL[metodoPago] ?? metodoPago}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerTxt}>{salon.nombre}</Text>
          <Text style={styles.footerTxt}>{salon.telefono ?? ""}</Text>
        </View>
      </Page>
    </Document>
  )
}
