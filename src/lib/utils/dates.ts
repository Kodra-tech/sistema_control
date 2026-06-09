import { format, isToday as fnsIsToday, isThisWeek, parseISO } from "date-fns"
import { es } from "date-fns/locale"

function toDate(value: Date | string): Date {
  if (typeof value === "string") return parseISO(value)
  return value
}

export function formatDate(date: Date | string): string {
  return format(toDate(date), "d 'de' MMMM yyyy", { locale: es })
}

export function formatShortDate(date: Date | string): string {
  return format(toDate(date), "dd/MM/yyyy")
}

export function formatTime(date: Date | string): string {
  return format(toDate(date), "HH:mm")
}

export function formatDateTime(date: Date | string): string {
  return format(toDate(date), "dd/MM/yyyy HH:mm", { locale: es })
}

export function isToday(date: Date | string): boolean {
  return fnsIsToday(toDate(date))
}

export function isThisWeekDate(date: Date | string): boolean {
  return isThisWeek(toDate(date), { locale: es })
}
