import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { env } from "./config/env";
import { prisma } from "./utils";
import { errorHandler } from "./middleware/error-handler";
import megaMenuRoutes from "./routes/megamenu";
import filtersRoutes from "./routes/filters";
import productsRoutes from "./routes/products.routes";

const app = new Hono();

// Middlewares de sécurité et utilitaires
app.use("*", logger());
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Routes
app.route("/api/megamenu", megaMenuRoutes);
app.route("/api/filters", filtersRoutes);
app.route("/api/products", productsRoutes);

app.get("/", (c) => c.text("Vignebbk API is running"));

// Gestion centralisée des erreurs
app.onError(errorHandler);

// Connexion Prisma et démarrage du serveur
async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Connexion Prisma réussie !");

    const port = parseInt(env.PORT);
    console.log(`🚀 Server running at http://localhost:${port}`);

    serve({
      fetch: app.fetch,
      port,
    });
  } catch (e) {
    console.error("❌ ÉCHEC du démarrage du serveur :", e);
    process.exit(1);
  }
}

// Graceful shutdown
const shutdown = async () => {
  console.log("Stopping server...");
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

startServer();
