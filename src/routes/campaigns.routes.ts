import { Hono } from "hono";
import { CampaignsService } from "../services/campaigns.service";
import { adminMiddleware as adminAuth } from "../middleware/auth";

const campaignsRoutes = new Hono();
const campaignsService = new CampaignsService();

// Public routes
campaignsRoutes.get("/active", async (c) => {
  const campaigns = await campaignsService.getActiveCampaigns();
  return c.json(campaigns);
});

campaignsRoutes.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const campaign = await campaignsService.getCampaignById(id);
  if (!campaign) return c.json({ error: "Campaign not found" }, 404);
  return c.json(campaign);
});

// Admin routes
campaignsRoutes.get("/", adminAuth, async (c) => {
  const campaigns = await campaignsService.getAllCampaigns();
  return c.json(campaigns);
});

campaignsRoutes.post("/", adminAuth, async (c) => {
  const body = await c.req.json();
  const campaign = await campaignsService.createCampaign(body);
  return c.json(campaign, 201);
});

campaignsRoutes.put("/:id", adminAuth, async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const campaign = await campaignsService.updateCampaign(id, body);
  return c.json(campaign);
});

campaignsRoutes.delete("/:id", adminAuth, async (c) => {
  const id = parseInt(c.req.param("id"));
  await campaignsService.deleteCampaign(id);
  return c.json({ success: true });
});

export default campaignsRoutes;
