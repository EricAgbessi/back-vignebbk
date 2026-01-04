import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ProductsService } from "../services/products.service";
import { productQuerySchema } from "../schemas/product.schema";
import { z } from "zod";
import { AppError } from "../middleware/error-handler";

const productsRoutes = new Hono();
const productsService = new ProductsService();

// Produits en vedette
productsRoutes.get(
  "/featured",
  zValidator("query", z.object({ limit: z.string().optional().default("12").transform(Number) })),
  async (c) => {
    const { limit } = c.req.valid("query");
    const products = await productsService.getFeaturedProducts(limit);

    return c.json({
      success: true,
      data: products,
      message: "Produits en vedette récupérés avec succès",
    });
  }
);

// Produits avec filtres
productsRoutes.get("/", zValidator("query", productQuerySchema), async (c) => {
  const filters = c.req.valid("query");
  const result = await productsService.getFilteredProducts(filters);

  return c.json({
    success: true,
    data: result.products,
    pagination: result.pagination,
    message: "Produits filtrés récupérés avec succès",
  });
});

// Produit par ID
productsRoutes.get(
  "/:id",
  zValidator("param", z.object({ id: z.string().transform(Number) })),
  async (c) => {
    const { id } = c.req.valid("param");

    if (isNaN(id)) {
      throw new AppError("ID de produit invalide", 400);
    }

    const product = await productsService.getProductById(id);

    if (!product) {
      throw new AppError("Produit non trouvé", 404);
    }

    return c.json({
      success: true,
      data: product,
      message: "Produit récupéré avec succès",
    });
  }
);

export default productsRoutes;
