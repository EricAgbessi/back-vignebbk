"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const MegamenuController_1 = require("../Controller/MegamenuController");
const megaMenuRoutes = new hono_1.Hono();
megaMenuRoutes.get("/", async (c) => {
    const megaMenu = await (0, MegamenuController_1.getAllMegaMenus)();
    return c.json(megaMenu);
});
exports.default = megaMenuRoutes;
