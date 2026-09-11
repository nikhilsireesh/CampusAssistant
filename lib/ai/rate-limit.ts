import "server-only";

/**
 * Very small in-memory rate limiter to protect the free Gemini quota.
 * Good enough for a single-instance college demo deployment; if this app
 * is ever scaled to multiple server instances, swap this for a shared
 * store (e.g. a Neon table or Redis) keyed the same way.
 */

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 8;
const MIN_GAP_MS = 2_000; // prevent rapid duplicate submissions

interface Bucket {
  timestamps: number[];
  lastMessage?: string;
  lastMessageAt?: number;
}

const buckets = new Map<number, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  reason?: "rate_limited" | "duplicate";
  retryAfterMs?: number;
}

export function checkAiRateLimit(userId: number, message: string): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(userId) ?? { timestamps: [] };

  // Duplicate/rapid resubmission guard
  if (bucket.lastMessage === message && bucket.lastMessageAt && now - bucket.lastMessageAt < MIN_GAP_MS) {
    return { allowed: false, reason: "duplicate", retryAfterMs: MIN_GAP_MS - (now - bucket.lastMessageAt) };
  }

  bucket.timestamps = bucket.timestamps.filter((t) => now - t < WINDOW_MS);

  if (bucket.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = bucket.timestamps[0];
    buckets.set(userId, bucket);
    return { allowed: false, reason: "rate_limited", retryAfterMs: WINDOW_MS - (now - oldest) };
  }

  bucket.timestamps.push(now);
  bucket.lastMessage = message;
  bucket.lastMessageAt = now;
  buckets.set(userId, bucket);

  return { allowed: true };
}

export const MAX_MESSAGE_LENGTH = 1000;
