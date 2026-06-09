import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

const ACCENT = "#18181b"
const GRAY   = "#71717a"
const LIGHT  = "#f4f4f5"
const BLACK  = "#09090b"

const styles = StyleSheet.create({
  page:          { fontFamily: "Helvetica", fontSize: 10, color: BLACK, padding: 40, backgroundColor: "#ffffff" },
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
  footer:        { position: "absolute", bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: LIGHT, paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  footerTxt:     { fontSize: 8, color: GRAY },
  vigencia:      { marginTop: 16, padding: "8 10", backgroundColor: "#fef3c7", borderRadius: 4 },
  vigenciaTxt:   { fontSize: 9, color: "#92400e" },
})

function fmtMXN(v: number): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(v)
}

export interface ServicioCot {
  nombre:   string
  cantidad: number
  precio:   number
}

export interface CotizacionData {
  salon:    { nombre: string; telefono?: string | null; email?: string | null; direccion?: string | null }
  cliente?: { nombre: string; telefono?: string | null; email?: string | null } | null
  servicios: ServicioCot[]
  numero?:  string
  fecha?:   string
}

export function CotizacionPDF({ data }: { data: CotizacionData }) {
  const { salon, cliente, servicios, numero, fecha } = data
  const subtotal = servicios.reduce((a, s) => a + s.precio * s.cantidad, 0)
  const fechaStr = fecha ?? new Date().toLocaleDateString("es-MX")

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.salonNombre}>{salon.nombre}</Text>
            {salon.telefono  && <Text style={styles.salonInfo}>{salon.telefono}</Text>}
            {salon.email     && <Text style={styles.salonInfo}>{salon.email}</Text>}
            {salon.direccion && <Text style={styles.salonInfo}>{salon.direccion}</Text>}
          </View>
          <View>
            <Text style={styles.docTitle}>COTIZACIÓN</Text>
            {numero && <Text style={styles.docNum}>No. {numero}</Text>}
            <Text style={styles.docFecha}>Fecha: {fechaStr}</Text>
          </View>
        </View>

        {/* Cliente */}
        {cliente && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitle}>Para</Text>
            <View style={styles.clienteBox}>
              <Text style={styles.clienteNombre}>{cliente.nombre}</Text>
              {cliente.telefono && <Text style={styles.clienteInfo}>Tel: {cliente.telefono}</Text>}
              {cliente.email    && <Text style={styles.clienteInfo}>{cliente.email}</Text>}
            </View>
          </View>
        )}

        {/* Tabla de servicios */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitle}>Servicios / Productos</Text>
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

        {/* Total */}
        <View style={styles.totalBox}>
          <View style={styles.totalInner}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValor}>{fmtMXN(subtotal)}</Text>
            </View>
            <View style={styles.totalFinal}>
              <Text style={styles.totalFinalLbl}>TOTAL</Text>
              <Text style={styles.totalFinalVal}>{fmtMXN(subtotal)}</Text>
            </View>
          </View>
        </View>

        {/* Vigencia */}
        <View style={styles.vigencia}>
          <Text style={styles.vigenciaTxt}>⏰ Cotización válida por 30 días a partir de la fecha de emisión.</Text>
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
