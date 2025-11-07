import { serve } from "@hono/node-server";
import { Context, Hono, Next } from "hono";
import megaMenuRoutes from "./routes/megamenu";
import { customCors, prisma } from "./utils";
import filtersRoutes from "./routes/filters";
import productsRoutes from "./routes/products.routes";

const app = new Hono();

async function testPrismaConnection() {
  try {
    await prisma.$connect(); // Tente de se connecter
    console.log("✅ Connexion Prisma réussie !");
  } catch (e) {
    console.error("❌ ÉCHEC de la connexion Prisma :", e);
    process.exit(1);
  }
}

app.use("*", async (c: Context, next: Next) => {
  return await customCors(c, next);
});

app.route("/api/megamenu", megaMenuRoutes);
app.route("/api/filters", filtersRoutes);
app.route("/api/products", productsRoutes);
app.get("/", (c) => c.text("Hello, Hono + TypeScript + Node.js!"));

app.onError((err, c) => {
  console.error("Erreur non gérée par Hono:", err.message);
  return c.text("Erreur interne du serveur (vérifiez la console)", 500);
});

const port = 4545;
console.log(`🚀 Server running at http://localhost:${port}`);

testPrismaConnection().then(() => {
  serve({
    fetch: app.fetch,
    port,
  });
});
