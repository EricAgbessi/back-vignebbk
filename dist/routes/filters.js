"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const filters_controller_1 = require("../Controller/filters.controller");
const filtersRoutes = new hono_1.Hono();
const filtersService = new filters_controller_1.FiltersService();
filtersRoutes.get("/", async (c) => {
    const filter = await filtersService.getAllFilters();
    return c.json(filter);
});
exports.default = filtersRoutes;
