"use client"

import { type InputHTMLAttributes } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface NumberInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value?:     number
  onChange:   (v: number | undefined) => void
  allowZero?: boolean   // show "0" when value is 0 (for stock, discount, etc.)
  prefix?:    string    // e.g. "$"
  suffix?:    string    // e.g. "%"
}

export function NumberInput({
  value,
  onChange,
  allowZero = false,
  prefix,
  suffix,
  className,
  onFocus,
  ...props
}: NumberInputProps) {
  // Show "" when value is 0 (and !allowZero) or undefined — field appears blank
  const displayValue =
    value === undefined || (value === 0 && !allowZero) ? "" : value

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    if (raw === "") { onChange(undefined); return }
    const n = parseFloat(raw)
    onChange(isNaN(n) ? undefined : n)
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.target.select()
    onFocus?.(e)
  }

  if (!prefix && !suffix) {
    return (
      <Input
        type="number"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        className={className}
        {...props}
      />
    )
  }

  return (
    <div
      className={cn(
        "flex h-9 items-center overflow-hidden rounded-md border border-input bg-transparent shadow-sm",
        "focus-within:ring-1 focus-within:ring-ring",
        props.disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      {prefix && (
        <span className="flex h-full items-center border-r border-input bg-muted/50 px-3 text-sm text-muted-foreground select-none">
          {prefix}
        </span>
      )}
      <input
        type="number"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        {...props}
      />
      {suffix && (
        <span className="flex h-full items-center border-l border-input bg-muted/50 px-3 text-sm text-muted-foreground select-none">
          {suffix}
        </span>
      )}
    </div>
  )
}
