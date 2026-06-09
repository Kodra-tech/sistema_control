import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function GastoTableSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-1">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-40" />
        </CardContent>
      </Card>
      <div className="rounded-md border p-4 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  )
}
