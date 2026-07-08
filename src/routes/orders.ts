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

// The client only declares which product and how many. Price and total are
// never trusted from the client: they are recomputed server-side from the DB.
const orderItemSchema = z.object({
  produit_id: z.number().int().positive(),
  quantity: z.number().int().positive().max(1000),
});

const createOrderSchema = z.object({
  produits: z.array(orderItemSchema).min(1).max(200),
  adresse: z.string().min(1).max(2000),
  telephone: z.string().min(3).max(20),
});

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

orderRoutes.post(
  "/",
  createOrderLimiter,
  optionalAuth,
  zValidator("json", createOrderSchema),
  async (c) => {
    const { produits, adresse, telephone } = c.req.valid("json");
    const payload = c.get("jwtPayload") as { id?: number } | undefined;

    const ids = [...new Set(produits.map((p) => p.produit_id))];
    const dbProducts = await prisma.produits.findMany({
      where: { id: { in: ids } },
      select: { id: true, nom: true, prix: true, promotion: true, disponible: true },
    });
    const byId = new Map(dbProducts.map((p) => [p.id, p]));

    // Recompute each line from the DB (effective price = prix - promotion%).
    const lines = [];
    let total = 0;
    for (const item of produits) {
      const product = byId.get(item.produit_id);
      if (!product || product.disponible === false || product.prix == null) {
        return c.json(
          { error: `Produit indisponible: ${item.produit_id}` },
          400
        );
      }
      const base = Number(product.prix);
      const promo = product.promotion != null ? Number(product.promotion) : 0;
      const unitPrice = round2(promo > 0 ? base * (1 - promo / 100) : base);
      const lineTotal = round2(unitPrice * item.quantity);
      total = round2(total + lineTotal);
      lines.push({
        produit_id: product.id,
        nom: product.nom,
        prix: unitPrice,
        quantity: item.quantity,
      });
    }

    const order = await prisma.commandes.create({
      data: {
        utilisateur_id: payload?.id ?? null,
        produits: lines as any,
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
