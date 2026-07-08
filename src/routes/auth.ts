import { Hono } from "hono";
import { sign } from "hono/jwt";
import { setCookie, deleteCookie } from "hono/cookie";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../utils";
import { env } from "../config/env";
import { send2FACode } from "../services/email.service";
import { AUTH_COOKIE_NAME, authMiddleware } from "../middleware/auth";
import { rateLimit } from "../middleware/rate-limit";

const authRoutes = new Hono();

const SESSION_DURATION_SECONDS = 60 * 60 * 24; // 24h
const TWO_FA_TTL_MS = 10 * 60 * 1000; // 10 minutes

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: "login",
  message: "Trop de tentatives de connexion. Réessayez dans 15 minutes.",
});

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: "verify-2fa",
  message: "Trop de tentatives de vérification. Réessayez dans 15 minutes.",
});

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(255),
});

const verifySchema = z.object({
  userId: z.number().int().positive(),
  code: z.string().regex(/^\d{6}$/),
});

function setSessionCookie(c: any, token: string) {
  const secure = env.COOKIE_SECURE
    ? env.COOKIE_SECURE === "true"
    : env.NODE_ENV === "production";

  setCookie(c, AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  });
}

// Step 1: Login with password -> Triggers 2FA
authRoutes.post("/login", loginLimiter, zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  const user = await prisma.utilisateurs.findUnique({ where: { email } });

  // Always use a constant-time-ish flow to limit user enumeration.
  const passwordOk = user
    ? await bcrypt.compare(password, user.mot_de_passe_hash)
    : await bcrypt.compare(password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvali");

  if (!user || !passwordOk) {
    return c.json({ error: "Identifiants invalides" }, 401);
  }

  if (user.r_le !== "administrateur") {
    return c.json({ error: "Accès refusé" }, 403);
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + TWO_FA_TTL_MS);

  await prisma.utilisateurs.update({
    where: { id: user.id },
    data: {
      two_factor_code: codeHash,
      two_factor_expires_at: expiresAt,
    },
  });

  try {
    await send2FACode(user.email, code);
  } catch (e) {
    console.error("Failed to send 2FA email:", e);
    return c.json({ error: "Erreur lors de l'envoi du code par email" }, 500);
  }

  return c.json({
    require2FA: true,
    userId: user.id,
    message: "Code de vérification envoyé par email",
  });
});

// Step 2: Verify 2FA Code -> Sets session cookie
authRoutes.post("/verify-2fa", verifyLimiter, zValidator("json", verifySchema), async (c) => {
  const { userId, code } = c.req.valid("json");

  const user = await prisma.utilisateurs.findUnique({ where: { id: userId } });

  if (
    !user ||
    !user.two_factor_code ||
    !user.two_factor_expires_at ||
    new Date() > user.two_factor_expires_at
  ) {
    return c.json({ error: "Code invalide ou expiré" }, 400);
  }

  const codeOk = await bcrypt.compare(code, user.two_factor_code);
  if (!codeOk) {
    return c.json({ error: "Code invalide ou expiré" }, 400);
  }

  await prisma.utilisateurs.update({
    where: { id: user.id },
    data: {
      two_factor_code: null,
      two_factor_expires_at: null,
      derni_re_connexion: new Date(),
    },
  });

  const token = await sign(
    {
      id: user.id,
      email: user.email,
      role: user.r_le,
      exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
    },
    env.JWT_SECRET
  );

  setSessionCookie(c, token);

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      nom: user.nom,
      pr_nom: user.pr_nom,
      role: user.r_le,
    },
  });
});

authRoutes.post("/logout", async (c) => {
  deleteCookie(c, AUTH_COOKIE_NAME, {
    path: "/",
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  });
  return c.json({ success: true });
});

authRoutes.get("/me", authMiddleware, async (c) => {
  const payload = c.get("jwtPayload") as { id: number };
  const user = await prisma.utilisateurs.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, nom: true, pr_nom: true, r_le: true },
  });

  if (!user) {
    return c.json({ error: "Utilisateur introuvable" }, 404);
  }

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      nom: user.nom,
      pr_nom: user.pr_nom,
      role: user.r_le,
    },
  });
});

export default authRoutes;
