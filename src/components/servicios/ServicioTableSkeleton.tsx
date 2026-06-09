import { Skeleton } from "@/components/ui/skeleton"

export function ServicioTableSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-8 w-28 ml-auto" />
      </div>
      <div className="rounded-md border">
        <div className="border-b p-3 grid grid-cols-7 gap-3">
          {["Servicio","Categoría","Precio","Costo","Margen","Estado",""].map((h) => (
            <Skeleton key={h} className="h-4 w-full max-w-[100px]" />
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="p-3 grid grid-cols-7 gap-3 border-b last:border-0">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-16 tabular-nums" />
            <Skeleton className="h-4 w-14 tabular-nums" />
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-7 w-7 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
