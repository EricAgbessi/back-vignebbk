// controllers/products.controller.ts
import { Request, Response } from "express";
import { ProductsService, ProductFilters } from "../services/products.service";

const productsService = new ProductsService();

export class ProductsController {
  // Produits en vedette
  async getFeaturedProducts(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 12;

      const products = await productsService.getFeaturedProducts(limit);

      res.json({
        success: true,
        data: products,
        message: "Produits en vedette récupérés avec succès",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Une erreur inconnue s'est produite",
        data: null,
      });
    }
  }

  // Produits avec filtres
  async getFilteredProducts(req: Request, res: Response) {
    try {
      const filters: ProductFilters = {
        types: req.query.types
          ? (req.query.types as string).split(",")
          : undefined,
        regions: req.query.regions
          ? (req.query.regions as string).split(",").map(Number)
          : undefined,
        classifications: req.query.classifications
          ? (req.query.classifications as string).split(",").map(Number)
          : undefined,
        cepages: req.query.cepages
          ? (req.query.cepages as string).split(",").map(Number)
          : undefined,
        styles: req.query.styles
          ? (req.query.styles as string).split(",")
          : undefined,
        millesimes: req.query.millesimes
          ? (req.query.millesimes as string).split(",").map(Number)
          : undefined,
        prixRange:
          req.query.prixMin || req.query.prixMax
            ? {
                min: req.query.prixMin
                  ? parseFloat(req.query.prixMin as string)
                  : undefined,
                max: req.query.prixMax
                  ? parseFloat(req.query.prixMax as string)
                  : undefined,
              }
            : undefined,
        alcoolRange:
          req.query.alcoolMin || req.query.alcoolMax
            ? {
                min: req.query.alcoolMin
                  ? parseFloat(req.query.alcoolMin as string)
                  : undefined,
                max: req.query.alcoolMax
                  ? parseFloat(req.query.alcoolMax as string)
                  : undefined,
              }
            : undefined,
        bio: req.query.bio ? req.query.bio === "true" : undefined,
        vegetalien: req.query.vegetalien
          ? req.query.vegetalien === "true"
          : undefined,
        promotion: req.query.promotion
          ? req.query.promotion === "true"
          : undefined,
        disponible: req.query.disponible
          ? req.query.disponible === "true"
          : true,
        search: req.query.search as string,
        sortBy: req.query.sortBy as ProductFilters["sortBy"],
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 12,
      };

      const result = await productsService.getFilteredProducts(filters);

      res.json({
        success: true,
        data: result.products,
        pagination: result.pagination,
        message: "Produits filtrés récupérés avec succès",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Une erreur inconnue s'est produite",
        data: null,
      });
    }
  }

  // Produit par ID
  async getProductById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de produit invalide",
          data: null,
        });
      }

      const product = await productsService.getProductById(id);

      res.json({
        success: true,
        data: product,
        message: "Produit récupéré avec succès",
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Produit non trouvé") {
        return res.status(404).json({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Une erreur inconnue s'est produite",
          data: null,
        });
      }
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Une erreur inconnue s'est produite",
        data: null,
      });
    }
  }
}
