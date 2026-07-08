import { Context, Next } from "hono";
import { verify } from "hono/jwt";
import { getCookie } from "hono/cookie";
import { env } from "../config/env";

export const AUTH_COOKIE_NAME = "vignebbk_session";

async function extractPayload(c: Context) {
  const cookieToken = getCookie(c, AUTH_COOKIE_NAME);
  let token = cookieToken;

  if (!token) {
    const authHeader = c.req.header("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token) return null;

  try {
    return await verify(token, env.JWT_SECRET);
  } catch {
    return null;
  }
}

export const authMiddleware = async (c: Context, next: Next) => {
  const payload = await extractPayload(c);
  if (!payload) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("jwtPayload", payload);
  await next();
};

export const adminMiddleware = async (c: Context, next: Next) => {
  const payload = await extractPayload(c);
  if (!payload) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  if (payload.role !== "administrateur") {
    return c.json({ error: "Forbidden" }, 403);
  }
  c.set("jwtPayload", payload);
  await next();
};

export const optionalAuth = async (c: Context, next: Next) => {
  const payload = await extractPayload(c);
  if (payload) {
    c.set("jwtPayload", payload);
  }
  await next();
};
