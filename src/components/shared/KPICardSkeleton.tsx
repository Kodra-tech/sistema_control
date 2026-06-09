import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface KPICardSkeletonProps {
  count?: number
}

function SingleKPISkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2 space-y-0">
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  )
}

export function KPICardSkeleton({ count = 4 }: KPICardSkeletonProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SingleKPISkeleton key={i} />
      ))}
    </div>
  )
}
