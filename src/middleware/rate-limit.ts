import { Context, Next } from "hono";

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
  const fwd = c.req.header("x-forwarded-for");
  const ip = fwd ? fwd.split(",")[0].trim() : c.req.header("x-real-ip") || "unknown";
  return `${prefix}:${ip}`;
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
