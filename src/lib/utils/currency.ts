const mxnFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
})

export function formatMXN(amount: number): string {
  return mxnFormatter.format(isNaN(amount) ? 0 : amount)
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return mxnFormatter.format(0)
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return mxnFormatter.format(isNaN(num) ? 0 : num)
}

export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]/g, "")) || 0
}
