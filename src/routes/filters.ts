import { Hono } from "hono";
import { FiltersService } from "../services/filters.service";

const filtersRoutes = new Hono();
const filtersService = new FiltersService();

filtersRoutes.get("/", async (c) => {
  const filters = await filtersService.getAllFilters();
  return c.json(filters);
});

export default filtersRoutes;
