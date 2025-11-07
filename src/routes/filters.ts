import { Hono } from "hono";
import { FiltersService } from "../Controller/filters.controller";

const filtersRoutes = new Hono();
const filtersService = new FiltersService();

filtersRoutes.get("/", async (c) => {
  const filter = await filtersService.getAllFilters();
  return c.json(filter);
});

export default filtersRoutes;
