"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

const CitaCalendar = dynamic(
  () => import("@/components/citas/CitaCalendar"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    ),
  },
)

export { CitaCalendar }
