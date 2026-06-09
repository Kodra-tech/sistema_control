"use client"

import Papa from "papaparse"

interface ColumnDef<T> {
  key:     keyof T
  header:  string
  format?: (val: T[keyof T], row: T) => string
}

export function exportToCSV<T extends object>(
  data:     T[],
  filename: string,
  columns:  ColumnDef<T>[],
): void {
  const rows = data.map((row) =>
    Object.fromEntries(
      columns.map((col) => [
        col.header,
        col.format
          ? col.format(row[col.key], row)
          : (row[col.key] ?? ""),
      ]),
    ),
  )

  const csv  = Papa.unparse(rows, { delimiter: ",", newline: "\n" })
  const bom  = "﻿"  // BOM para Excel en español
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href  = url
  link.setAttribute("download", `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function fmtFechaCSV(fecha: Date | string): string {
  const d = fecha instanceof Date ? fecha : new Date(fecha)
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  return `${dd}/${mm}/${d.getFullYear()}`
}

export function fmtMontoCSV(v: unknown): string {
  return Number(v ?? 0).toFixed(2)
}
