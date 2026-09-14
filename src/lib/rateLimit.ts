/**
 * In-memory sliding window rate limiter for authentication endpoints
 * Designed to prevent brute-force attacks on operator logins.
 */

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// IP -> RateLimitEntry
const rateLimitStore = new Map<string, RateLimitEntry>();

// Periodically clean up expired entries
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitStore.entries()) {
      if (now - entry.lastAttempt > WINDOW_MS) {
        rateLimitStore.delete(ip);
      }
    }
  }, 2 * 60 * 1000);
  if (timer && typeof timer.unref === "function") {
    timer.unref();
  }
}

/**
 * Checks whether an IP address is currently allowed to attempt login.
 */
export function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry) {
    return { allowed: true, remaining: MAX_FAILED_ATTEMPTS, retryAfterSec: 0 };
  }

  if (now - entry.lastAttempt > WINDOW_MS) {
    rateLimitStore.delete(ip);
    return { allowed: true, remaining: MAX_FAILED_ATTEMPTS, retryAfterSec: 0 };
  }

  if (entry.count >= MAX_FAILED_ATTEMPTS) {
    const elapsed = now - entry.lastAttempt;
    const retryAfterSec = Math.max(1, Math.ceil((WINDOW_MS - elapsed) / 1000));
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  return {
    allowed: true,
    remaining: MAX_FAILED_ATTEMPTS - entry.count,
    retryAfterSec: 0,
  };
}

/**
 * Records a failed login attempt for the given IP address.
 */
export function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now - entry.lastAttempt > WINDOW_MS) {
    rateLimitStore.set(ip, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    });
  } else {
    entry.count += 1;
    entry.lastAttempt = now;
  }
}

/**
 * Resets the rate limit counter upon a successful login.
 */
export function resetRateLimit(ip: string): void {
  rateLimitStore.delete(ip);
}
