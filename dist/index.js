"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_server_1 = require("@hono/node-server");
const hono_1 = require("hono");
const megamenu_1 = __importDefault(require("./routes/megamenu"));
const utils_1 = require("./utils");
const filters_1 = __importDefault(require("./routes/filters"));
const products_routes_1 = __importDefault(require("./routes/products.routes"));
require("dotenv/config");
const config_1 = require("prisma/config");
const app = new hono_1.Hono();
async function testPrismaConnection() {
    try {
        await utils_1.prisma.$connect(); // Tente de se connecter
        console.log("✅ Connexion Prisma réussie !");
    }
    catch (e) {
        console.error("❌ ÉCHEC de la connexion Prisma :", e);
        process.exit(1);
    }
}
app.use("*", async (c, next) => {
    return await (0, utils_1.customCors)(c, next);
});
app.route("/api/megamenu", megamenu_1.default);
app.route("/api/filters", filters_1.default);
app.route("/api/products", products_routes_1.default);
app.get("/", (c) => c.text("Hello, Hono + TypeScript + Node.js!"));
app.onError((err, c) => {
    console.error("Erreur non gérée par Hono:", err.message);
    return c.text("Erreur interne du serveur (vérifiez la console)", 500);
});
const port = parseInt((0, config_1.env)("PORT"));
console.log(`🚀 Server running at http://localhost:${port}`);
testPrismaConnection().then(() => {
    (0, node_server_1.serve)({
        fetch: app.fetch,
        port,
    });
});
