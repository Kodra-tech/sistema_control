import { Skeleton } from "@/components/ui/skeleton"

export function ClienteTableSkeleton() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-8 w-32 ml-auto" />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className="border-b p-3 grid grid-cols-6 gap-4">
          {["Nombre completo", "Teléfono", "Email", "Registro", "Estado", ""].map((h) => (
            <Skeleton key={h} className="h-4 w-full max-w-[120px]" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="p-3 grid grid-cols-6 gap-4 border-b last:border-0">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-7 w-7 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
