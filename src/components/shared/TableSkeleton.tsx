import { Skeleton } from "@/components/ui/skeleton"

interface TableSkeletonProps {
  rows?:    number
  columns?: number
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex gap-4 pb-2 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" style={{ width: `${60 + (i % 3) * 20}px`, flex: "none" }} />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex gap-4 items-center">
          {Array.from({ length: columns }).map((_, col) => (
            <Skeleton
              key={col}
              className="h-4"
              style={{ width: `${50 + ((row + col) % 4) * 25}px`, flex: "none" }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
