import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { env, corsOrigins } from "./config/env";
import { prisma } from "./utils";
import { errorHandler } from "./middleware/error-handler";
import megaMenuRoutes from "./routes/megamenu";
import filtersRoutes from "./routes/filters";
import productsRoutes from "./routes/products.routes";
import authRoutes from "./routes/auth";
import notificationRoutes from "./routes/notifications";
import orderRoutes from "./routes/orders";
import referentialsRoutes from "./routes/referentials.routes";
import uploadRoutes from "./routes/upload.routes";
import campaignsRoutes from "./routes/campaigns.routes";
import caissesRoutes from "./routes/caisses.routes";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  secureHeaders({
    crossOriginResourcePolicy: "cross-origin",
    crossOriginOpenerPolicy: "unsafe-none",
    crossOriginEmbedderPolicy: "unsafe-none",
  })
);

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return ""; // same-origin / server-to-server: no CORS header needed
      return corsOrigins.includes(origin) ? origin : "";
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    maxAge: 86400,
  })
);

app.get("/health", (c) => c.json({ ok: true }));
app.get("/", (c) => c.text("Vignebbk API is running"));

app.route("/api/megamenu", megaMenuRoutes);
app.route("/api/filters", filtersRoutes);
app.route("/api/products", productsRoutes);
app.route("/api/auth", authRoutes);
app.route("/api/notifications", notificationRoutes);
app.route("/api/orders", orderRoutes);
app.route("/api/referentials", referentialsRoutes);
app.route("/api/upload", uploadRoutes);
app.route("/api/campaigns", campaignsRoutes);
app.route("/api/caisses", caissesRoutes);

app.onError(errorHandler);

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Connexion Prisma réussie !");

    const port = parseInt(env.PORT);
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log(`🔒 CORS allowlist: ${corsOrigins.join(", ") || "(none)"}`);

    serve({
      fetch: app.fetch,
      port,
    });
  } catch (e) {
    console.error("❌ ÉCHEC du démarrage du serveur :", e);
    if (typeof process !== "undefined") process.exit(1);
  }
}

const shutdown = async () => {
  console.log("Stopping server...");
  await prisma.$disconnect();
  if (typeof process !== "undefined") process.exit(0);
};

if (typeof process !== "undefined") {
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer();
