import { InventarioTableSkeleton } from "@/components/inventario/InventarioTableSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <InventarioTableSkeleton />
    </div>
  )
}
