import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ProductsService } from "../services/products.service";
import {
  productQuerySchema,
  createProductSchema,
  updateProductSchema,
  stockUpdateSchema,
} from "../schemas/product.schema";
import { z } from "zod";
import { AppError } from "../middleware/error-handler";
import { adminMiddleware } from "../middleware/auth";

const productsRoutes = new Hono();
const productsService = new ProductsService();

const idParamSchema = z.object({ id: z.string().regex(/^\d+$/).transform(Number) });

// Public routes ----------------------------------------------------

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

productsRoutes.get(
  "/search",
  zValidator(
    "query",
    z.object({
      q: z.string().min(1).max(100),
      limit: z.string().optional().default("5").transform(Number),
    })
  ),
  async (c) => {
    const { q, limit } = c.req.valid("query");
    const products = await productsService.searchProducts(q, limit);
    return c.json({
      success: true,
      data: products,
      message: "Résultats de recherche récupérés avec succès",
    });
  }
);

productsRoutes.get(
  "/:id",
  zValidator("param", idParamSchema),
  async (c) => {
    const { id } = c.req.valid("param");
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

// Admin-protected routes -------------------------------------------

productsRoutes.post(
  "/",
  adminMiddleware,
  zValidator("json", createProductSchema),
  async (c) => {
    const body = c.req.valid("json");
    try {
      const product = await productsService.createProduct(body);
      return c.json({
        success: true,
        data: product,
        message: "Produit créé avec succès",
      });
    } catch (error: any) {
      console.error("Error creating product:", error);
      return c.json(
        {
          success: false,
          message: "Erreur lors de la création du produit",
          ...(process.env.NODE_ENV !== "production"
            ? { error: error?.message || "Unknown error" }
            : {}),
        },
        400
      );
    }
  }
);

productsRoutes.put(
  "/:id",
  adminMiddleware,
  zValidator("param", idParamSchema),
  zValidator("json", updateProductSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    try {
      const product = await productsService.updateProduct(id, body);
      return c.json({
        success: true,
        data: product,
        message: "Produit mis à jour avec succès",
      });
    } catch (error: any) {
      console.error("Error updating product:", error);
      return c.json(
        {
          success: false,
          message: "Erreur lors de la mise à jour du produit",
          ...(process.env.NODE_ENV !== "production"
            ? { error: error?.message || "Unknown error" }
            : {}),
        },
        400
      );
    }
  }
);

productsRoutes.delete(
  "/:id",
  adminMiddleware,
  zValidator("param", idParamSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    await productsService.deleteProduct(id);
    return c.json({
      success: true,
      message: "Produit supprimé avec succès",
    });
  }
);

productsRoutes.post(
  "/:id/stock",
  adminMiddleware,
  zValidator("param", idParamSchema),
  zValidator("json", stockUpdateSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const { quantity, type, reason } = c.req.valid("json");

    const result = await productsService.updateStock(id, quantity, type, reason);

    return c.json({
      success: true,
      data: result,
      message: "Stock mis à jour avec succès",
    });
  }
);

export default productsRoutes;
