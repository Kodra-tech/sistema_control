import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-1">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-60" />
      </div>
      {[1,2,3].map((i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
    </div>
  )
}
