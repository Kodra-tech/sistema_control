import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export interface MobileCardField {
  label: string
  value: ReactNode
  className?: string
}

interface MobileCardProps {
  fields:      MobileCardField[]
  actions?:    ReactNode
  className?:  string
  onClick?:    () => void
}

export function MobileCard({ fields, actions, className, onClick }: MobileCardProps) {
  return (
    <Card
      className={cn(
        "relative",
        onClick && "cursor-pointer hover:bg-accent/40 transition-colors",
        className,
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            {fields.map((field, i) => (
              <div key={i} className="flex items-baseline gap-2 text-sm">
                <span className="text-muted-foreground shrink-0 text-xs w-20">{field.label}</span>
                <span className={cn("font-medium truncate", field.className)}>{field.value}</span>
              </div>
            ))}
          </div>

          {actions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Acciones</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
