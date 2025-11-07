// routes/products.routes.ts
import { Hono } from "hono";
import { ProductsService } from "../services/products.service";

const productsRoutes = new Hono();
const productsService = new ProductsService();

// Produits en vedette
productsRoutes.get("/featured", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") || "12");
    const products = await productsService.getFeaturedProducts(limit);

    return c.json({
      success: true,
      data: products,
      message: "Produits en vedette récupérés avec succès",
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        //@ts-ignore
        message: error.message,
        data: null,
      },
      500
    );
  }
});

// Produits avec filtres
productsRoutes.get("/", async (c) => {
  try {
    const query = c.req.query();

    const filters = {
      types: query.types ? query.types.split(",") : undefined,
      regions: query.regions ? query.regions.split(",").map(Number) : undefined,
      classifications: query.classifications
        ? query.classifications.split(",").map(Number)
        : undefined,
      cepages: query.cepages ? query.cepages.split(",").map(Number) : undefined,
      styles: query.styles ? query.styles.split(",") : undefined,
      millesimes: query.millesimes
        ? query.millesimes.split(",").map(Number)
        : undefined,
      prixRange:
        query.prixMin && query.prixMax
          ? {
              min: parseFloat(query.prixMin),
              max: parseFloat(query.prixMax),
            }
          : undefined,
      alcoolRange:
        query.alcoolMin && query.alcoolMax
          ? {
              min: parseFloat(query.alcoolMin),
              max: parseFloat(query.alcoolMax),
            }
          : undefined,
      bio: query.bio ? query.bio === "true" : undefined,
      vegetalien: query.vegetalien ? query.vegetalien === "true" : undefined,
      promotion: query.promotion ? query.promotion === "true" : undefined,
      disponible: query.disponible ? query.disponible === "true" : true,
      search: query.search,
      sortBy: query.sortBy as any,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 12,
    };

    const result = await productsService.getFilteredProducts(filters);

    return c.json({
      success: true,
      data: result.products,
      pagination: result.pagination,
      message: "Produits filtrés récupérés avec succès",
    });
  } catch (error) {
    console.log(
      c.json({
        success: false,
        //@ts-ignore
        message: error.message,
        data: null,
      })
    );
    return c.json(
      {
        success: false,
        //@ts-ignore
        message: error.message,
        data: null,
      },
      500
    );
  }
});

// Produit par ID
productsRoutes.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    if (isNaN(id)) {
      return c.json(
        {
          success: false,
          message: "ID de produit invalide",
          data: null,
        },
        400
      );
    }

    const product = await productsService.getProductById(id);

    return c.json({
      success: true,
      data: product,
      message: "Produit récupéré avec succès",
    });
  } catch (error) {
    //@ts-ignore
    if (error.message === "Produit non trouvé") {
      return c.json(
        {
          success: false,
          //@ts-ignore
          message: error.message,
          data: null,
        },
        404
      );
    }
    return c.json(
      {
        success: false,
        //@ts-ignore
        message: error.message,
        data: null,
      },
      500
    );
  }
});

export default productsRoutes;
