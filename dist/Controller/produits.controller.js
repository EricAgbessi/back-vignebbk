"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsController = void 0;
// controllers/products.controller.ts
const products_service_1 = require("../services/products.service");
const productsService = new products_service_1.ProductsService();
class ProductsController {
    // Produits en vedette
    async getFeaturedProducts(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 12;
            const products = await productsService.getFeaturedProducts(limit);
            res.json({
                success: true,
                data: products,
                message: "Produits en vedette récupérés avec succès",
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error instanceof Error
                    ? error.message
                    : "Une erreur inconnue s'est produite",
                data: null,
            });
        }
    }
    // Produits avec filtres
    async getFilteredProducts(req, res) {
        try {
            const filters = {
                types: req.query.types
                    ? req.query.types.split(",")
                    : undefined,
                regions: req.query.regions
                    ? req.query.regions.split(",").map(Number)
                    : undefined,
                classifications: req.query.classifications
                    ? req.query.classifications.split(",").map(Number)
                    : undefined,
                cepages: req.query.cepages
                    ? req.query.cepages.split(",").map(Number)
                    : undefined,
                styles: req.query.styles
                    ? req.query.styles.split(",")
                    : undefined,
                millesimes: req.query.millesimes
                    ? req.query.millesimes.split(",").map(Number)
                    : undefined,
                prixRange: req.query.prixMin || req.query.prixMax
                    ? {
                        min: req.query.prixMin
                            ? parseFloat(req.query.prixMin)
                            : undefined,
                        max: req.query.prixMax
                            ? parseFloat(req.query.prixMax)
                            : undefined,
                    }
                    : undefined,
                alcoolRange: req.query.alcoolMin || req.query.alcoolMax
                    ? {
                        min: req.query.alcoolMin
                            ? parseFloat(req.query.alcoolMin)
                            : undefined,
                        max: req.query.alcoolMax
                            ? parseFloat(req.query.alcoolMax)
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
                search: req.query.search,
                sortBy: req.query.sortBy,
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 12,
            };
            const result = await productsService.getFilteredProducts(filters);
            res.json({
                success: true,
                data: result.products,
                pagination: result.pagination,
                message: "Produits filtrés récupérés avec succès",
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error instanceof Error
                    ? error.message
                    : "Une erreur inconnue s'est produite",
                data: null,
            });
        }
    }
    // Produit par ID
    async getProductById(req, res) {
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
        }
        catch (error) {
            if (error instanceof Error && error.message === "Produit non trouvé") {
                return res.status(404).json({
                    success: false,
                    message: error instanceof Error
                        ? error.message
                        : "Une erreur inconnue s'est produite",
                    data: null,
                });
            }
            res.status(500).json({
                success: false,
                message: error instanceof Error
                    ? error.message
                    : "Une erreur inconnue s'est produite",
                data: null,
            });
        }
    }
}
exports.ProductsController = ProductsController;
