import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { ReferentialsService } from "../services/referentials.service";
import { adminMiddleware } from "../middleware/auth";

const referentialsRoutes = new Hono();
const service = new ReferentialsService();

const idParam = z.object({ id: z.string().regex(/^\d+$/).transform(Number) });

const regionSchema = z.object({
  nom: z.string().min(1).max(100),
  pays: z.string().max(100).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  climat: z.enum(["oc_anique", "continental", "m_diterran_en", "montagnard"]).optional().nullable(),
  superficie: z.union([z.number(), z.string()]).optional().nullable(),
}).strict();

const domaineSchema = z.object({
  nom: z.string().min(1).max(255),
  region_id: z.number().int().positive(),
  propri_taire: z.string().max(255).optional().nullable(),
  ann_e_fondation: z.union([z.number().int(), z.string()]).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  adresse: z.string().max(2000).optional().nullable(),
  site_web: z.string().max(255).optional().nullable(),
}).strict();

const cepageSchema = z.object({
  nom: z.string().min(1).max(100),
  type: z.enum(["rouge", "blanc", "ros_"]).optional().nullable(),
  couleur_baie: z.enum(["noire", "blanche", "grise", "rose"]).optional().nullable(),
  origine: z.string().max(100).optional().nullable(),
  caract_ristiques: z.string().max(5000).optional().nullable(),
  ar_mes_typiques: z.string().max(5000).optional().nullable(),
  maturit_: z.enum(["pr_coce", "tardive", "moyenne"]).optional().nullable(),
  vigoure: z.enum(["faible", "moyenne", "forte"]).optional().nullable(),
}).strict();

const classificationSchema = z.object({
  nom: z.string().min(1).max(100),
  niveau: z.string().max(50).optional().nullable(),
  region_id: z.number().int().positive().optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  ann_e_creation: z.union([z.number().int(), z.string()]).optional().nullable(),
}).strict();

const accordSchema = z.object({
  nom: z.string().min(1).max(100),
  cat_gorie: z.string().max(50).optional().nullable(),
  sous_cat_gorie: z.string().max(100).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  force_accord: z.enum(["l_ger", "moyen", "fort"]).optional().nullable(),
  exemples: z.string().max(5000).optional().nullable(),
  image_url: z.string().max(2048).optional().nullable(),
}).strict();

// Public reads ----------------------------------------------------

referentialsRoutes.get("/regions", async (c) => {
  return c.json({ success: true, data: await service.getRegions() });
});
referentialsRoutes.get("/domaines", async (c) => {
  return c.json({ success: true, data: await service.getDomaines() });
});
referentialsRoutes.get("/cepages", async (c) => {
  return c.json({ success: true, data: await service.getCepages() });
});
referentialsRoutes.get("/classifications", async (c) => {
  return c.json({ success: true, data: await service.getClassifications() });
});
referentialsRoutes.get("/accords-mets", async (c) => {
  return c.json({ success: true, data: await service.getAccordsMets() });
});

// Admin-only mutations -------------------------------------------

referentialsRoutes.post("/regions", adminMiddleware, zValidator("json", regionSchema), async (c) => {
  const region = await service.createRegion(c.req.valid("json"));
  return c.json({ success: true, data: region });
});
referentialsRoutes.put("/regions/:id", adminMiddleware, zValidator("param", idParam), zValidator("json", regionSchema.partial()), async (c) => {
  const { id } = c.req.valid("param");
  const region = await service.updateRegion(id, c.req.valid("json"));
  return c.json({ success: true, data: region });
});
referentialsRoutes.delete("/regions/:id", adminMiddleware, zValidator("param", idParam), async (c) => {
  const { id } = c.req.valid("param");
  await service.deleteRegion(id);
  return c.json({ success: true, message: "Region deleted" });
});

referentialsRoutes.post("/domaines", adminMiddleware, zValidator("json", domaineSchema), async (c) => {
  const domaine = await service.createDomaine(c.req.valid("json"));
  return c.json({ success: true, data: domaine });
});
referentialsRoutes.put("/domaines/:id", adminMiddleware, zValidator("param", idParam), zValidator("json", domaineSchema.partial()), async (c) => {
  const { id } = c.req.valid("param");
  const domaine = await service.updateDomaine(id, c.req.valid("json"));
  return c.json({ success: true, data: domaine });
});
referentialsRoutes.delete("/domaines/:id", adminMiddleware, zValidator("param", idParam), async (c) => {
  const { id } = c.req.valid("param");
  await service.deleteDomaine(id);
  return c.json({ success: true, message: "Domaine deleted" });
});

referentialsRoutes.post("/cepages", adminMiddleware, zValidator("json", cepageSchema), async (c) => {
  const cepage = await service.createCepage(c.req.valid("json"));
  return c.json({ success: true, data: cepage });
});
referentialsRoutes.put("/cepages/:id", adminMiddleware, zValidator("param", idParam), zValidator("json", cepageSchema.partial()), async (c) => {
  const { id } = c.req.valid("param");
  const cepage = await service.updateCepage(id, c.req.valid("json"));
  return c.json({ success: true, data: cepage });
});
referentialsRoutes.delete("/cepages/:id", adminMiddleware, zValidator("param", idParam), async (c) => {
  const { id } = c.req.valid("param");
  await service.deleteCepage(id);
  return c.json({ success: true, message: "Cepage deleted" });
});

referentialsRoutes.post("/classifications", adminMiddleware, zValidator("json", classificationSchema), async (c) => {
  const classification = await service.createClassification(c.req.valid("json"));
  return c.json({ success: true, data: classification });
});
referentialsRoutes.put("/classifications/:id", adminMiddleware, zValidator("param", idParam), zValidator("json", classificationSchema.partial()), async (c) => {
  const { id } = c.req.valid("param");
  const classification = await service.updateClassification(id, c.req.valid("json"));
  return c.json({ success: true, data: classification });
});
referentialsRoutes.delete("/classifications/:id", adminMiddleware, zValidator("param", idParam), async (c) => {
  const { id } = c.req.valid("param");
  await service.deleteClassification(id);
  return c.json({ success: true, message: "Classification deleted" });
});

referentialsRoutes.post("/accords-mets", adminMiddleware, zValidator("json", accordSchema), async (c) => {
  const accord = await service.createAccord(c.req.valid("json"));
  return c.json({ success: true, data: accord });
});
referentialsRoutes.put("/accords-mets/:id", adminMiddleware, zValidator("param", idParam), zValidator("json", accordSchema.partial()), async (c) => {
  const { id } = c.req.valid("param");
  const accord = await service.updateAccord(id, c.req.valid("json"));
  return c.json({ success: true, data: accord });
});
referentialsRoutes.delete("/accords-mets/:id", adminMiddleware, zValidator("param", idParam), async (c) => {
  const { id } = c.req.valid("param");
  await service.deleteAccord(id);
  return c.json({ success: true, message: "Accord deleted" });
});

export default referentialsRoutes;
