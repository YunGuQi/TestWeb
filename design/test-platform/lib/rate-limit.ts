// Simple in-memory rate limiter
interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const limits = new Map<string, RateLimitInfo>();

export function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = limits.get(ip);
  
  if (!record) {
    limits.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (now > record.resetTime) {
    // Window expired, reset
    record.count = 1;
    record.resetTime = now + windowMs;
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count += 1;
  return true;
}

// Cleanup interval to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of limits.entries()) {
      if (now > record.resetTime) {
        limits.delete(ip);
      }
    }
  }, 60000); // Cleanup every minute
}
