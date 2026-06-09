import { Skeleton } from "@/components/ui/skeleton"

export function InventarioTableSkeleton() {
  return (
    <div className="rounded-md border p-4 space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}
