import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../utils";
import { sendOrderEmail } from "../services/email.service";
import { adminMiddleware, optionalAuth } from "../middleware/auth";
import { rateLimit } from "../middleware/rate-limit";

const orderRoutes = new Hono();

const createOrderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyPrefix: "order-create",
  message: "Trop de commandes en peu de temps. Réessayez dans une minute.",
});

const orderItemSchema = z.object({
  produit_id: z.number().int().positive().optional(),
  nom: z.string().min(1).max(255),
  prix: z.number().nonnegative(),
  quantity: z.number().int().positive().max(1000),
});

const createOrderSchema = z.object({
  produits: z.array(orderItemSchema).min(1).max(200),
  total: z.number().nonnegative(),
  adresse: z.string().min(1).max(2000),
  telephone: z.string().min(3).max(20),
});

orderRoutes.post(
  "/",
  createOrderLimiter,
  optionalAuth,
  zValidator("json", createOrderSchema),
  async (c) => {
    const { produits, total, adresse, telephone } = c.req.valid("json");
    const payload = c.get("jwtPayload") as { id?: number } | undefined;

    const order = await prisma.commandes.create({
      data: {
        utilisateur_id: payload?.id ?? null,
        produits: produits as any,
        total,
        adresse,
        telephone,
        statut: "en_attente",
      },
    });

    sendOrderEmail(order).catch(console.error);

    return c.json({ success: true, order });
  }
);

orderRoutes.get("/", adminMiddleware, async (c) => {
  const orders = await prisma.commandes.findMany({
    orderBy: { created_at: "desc" },
  });
  return c.json(orders);
});

export default orderRoutes;
