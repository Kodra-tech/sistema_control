import { Ratelimit } from "@upstash/ratelimit"
import { redis } from "@/lib/redis"

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "10 s"),
  analytics: false,
})

export async function checkRateLimit(identifier: string): Promise<{
  success: boolean
  headers: Record<string, string>
}> {
  const { success, limit, remaining } = await ratelimit.limit(identifier)
  return {
    success,
    headers: {
      "X-RateLimit-Limit":     String(limit),
      "X-RateLimit-Remaining": String(remaining),
    },
  }
}
