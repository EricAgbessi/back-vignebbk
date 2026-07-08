import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { CaissesService } from "../services/caisses.service";
import { adminMiddleware } from "../middleware/auth";
import { createCaisseSchema, updateCaisseSchema } from "../schemas/caisse.schema";

const caissesRoutes = new Hono();
const caissesService = new CaissesService();

// Admin routes only for now
caissesRoutes.use("*", adminMiddleware);

caissesRoutes.post("/", zValidator("json", createCaisseSchema), async (c) => {
  const body = c.req.valid("json");
  const caisse = await caissesService.createCaisse(body);
  return c.json(caisse, 201);
});

caissesRoutes.put("/:id", zValidator("json", updateCaisseSchema), async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = c.req.valid("json");
  const caisse = await caissesService.updateCaisse(id, body);
  return c.json(caisse);
});

caissesRoutes.delete("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  await caissesService.deleteCaisse(id);
  return c.json({ success: true });
});

caissesRoutes.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const caisse = await caissesService.getCaisseById(id);
  if (!caisse) return c.json({ error: "Caisse not found" }, 404);
  return c.json(caisse);
});

export default caissesRoutes;
