// Simple in-memory rate limiter for demo
// In production, use Redis or similar distributed cache

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export async function rateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 3600000 // 1 hour
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const now = Date.now()
  const key = identifier
  
  // Clean up expired entries
  for (const [k, v] of rateLimitStore.entries()) {
    if (v.resetTime <= now) {
      rateLimitStore.delete(k)
    }
  }
  
  const entry = rateLimitStore.get(key)
  
  if (!entry) {
    // First request
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    
    return {
      success: true,
      remaining: limit - 1,
      reset: now + windowMs
    }
  }
  
  if (entry.resetTime <= now) {
    // Window expired, reset
    entry.count = 1
    entry.resetTime = now + windowMs
    
    return {
      success: true,
      remaining: limit - 1,
      reset: entry.resetTime
    }
  }
  
  if (entry.count >= limit) {
    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      reset: entry.resetTime
    }
  }
  
  // Increment counter
  entry.count++
  
  return {
    success: true,
    remaining: limit - entry.count,
    reset: entry.resetTime
  }
}
