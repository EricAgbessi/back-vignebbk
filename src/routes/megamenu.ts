import { Hono } from "hono";
import { MegamenuService } from "../services/megamenu.service";

const megaMenuRoutes = new Hono();
const megamenuService = new MegamenuService();

megaMenuRoutes.get("/", async (c) => {
  const megaMenu = await megamenuService.getAllMegaMenus();
  return c.json(megaMenu);
});

export default megaMenuRoutes;
