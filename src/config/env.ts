import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.string().default("8080"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  // Comma-separated allowlist of front-end origins, e.g. "https://vignebbk.com,https://www.vignebbk.com"
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  // Optional: set Cookie Domain for cross-subdomain sessions, e.g. ".vignebbk.com"
  COOKIE_DOMAIN: z.string().optional(),
  // Force-enable/disable the Secure flag on the session cookie. Defaults to
  // true in production. Set to "false" if you deploy behind plain HTTP.
  COOKIE_SECURE: z.enum(["true", "false"]).optional(),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.string().default("587"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  ADMIN_EMAIL: z.string().email().default("admin@vignebbk.com"),
  // Public origin used when generating absolute URLs (e.g. uploaded file URLs)
  PUBLIC_BASE_URL: z.string().url().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  process.exit(1);
}

export const env = _env.data;

export const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((o) => o.trim())
  .filter(Boolean);
