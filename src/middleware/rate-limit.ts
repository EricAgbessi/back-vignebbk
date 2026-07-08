import { Context, Next } from "hono";
import { getConnInfo } from "@hono/node-server/conninfo";

interface Bucket {
  count: number;
  resetAt: number;
}

interface Options {
  windowMs: number;
  max: number;
  keyPrefix?: string;
  message?: string;
}

const buckets = new Map<string, Bucket>();

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000).unref?.();

function clientKey(c: Context, prefix: string): string {
  // Cloudflare sets CF-Connecting-IP with the real client IP and overwrites any
  // client-supplied value, so it is trustworthy when traffic goes through CF.
  // Otherwise fall back to the real socket address. We never trust raw
  // X-Forwarded-For: its leftmost value is client-controllable and would let an
  // attacker rotate the rate-limit key on every request.
  let ip = c.req.header("cf-connecting-ip")?.trim();
  if (!ip) {
    try {
      ip = getConnInfo(c).remote.address;
    } catch {
      ip = undefined;
    }
  }
  return `${prefix}:${ip || "unknown"}`;
}

export function rateLimit(options: Options) {
  const { windowMs, max, keyPrefix = "rl", message = "Trop de requêtes, réessayez plus tard." } = options;

  return async (c: Context, next: Next) => {
    const key = clientKey(c, keyPrefix);
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (bucket.count >= max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      c.header("Retry-After", String(retryAfter));
      return c.json({ error: message }, 429);
    }

    bucket.count += 1;
    return next();
  };
}
