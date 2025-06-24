// Rate limiting utilities

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private attempts: Map<string, RateLimitEntry> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number, windowMs: number) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const entry = this.attempts.get(identifier);

    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return false;
    }

    if (entry.count >= this.maxAttempts) {
      return true;
    }

    // Increment count
    entry.count++;
    return false;
  }

  getRemainingAttempts(identifier: string): number {
    const entry = this.attempts.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxAttempts;
    }
    return Math.max(0, this.maxAttempts - entry.count);
  }

  getResetTime(identifier: string): number {
    const entry = this.attempts.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return Date.now();
    }
    return entry.resetTime;
  }

  // Clean up old entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.attempts.entries()) {
      if (now > entry.resetTime) {
        this.attempts.delete(key);
      }
    }
  }
}

// Different rate limiters for different operations
export const betRateLimiter = new RateLimiter(10, 60 * 60 * 1000); // 10 bets per hour
export const userCreationRateLimiter = new RateLimiter(3, 60 * 60 * 1000); // 3 user creations per hour
export const adminRateLimiter = new RateLimiter(100, 60 * 60 * 1000); // 100 admin actions per hour

// Clean up old entries every 10 minutes
setInterval(() => {
  betRateLimiter.cleanup();
  userCreationRateLimiter.cleanup();
  adminRateLimiter.cleanup();
}, 10 * 60 * 1000);

export function getClientIP(request: Request): string {
  // Try to get real IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (clientIP) {
    return clientIP;
  }
  
  // Fallback to a default for local development
  return 'unknown';
}