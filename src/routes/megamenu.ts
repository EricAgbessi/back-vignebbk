import { Hono } from "hono";
import { getAllMegaMenus } from "../Controller/MegamenuController";

const megaMenuRoutes = new Hono();

megaMenuRoutes.get("/", async (c) => {
  const megaMenu = await getAllMegaMenus();
  return c.json(megaMenu);
});

export default megaMenuRoutes;
