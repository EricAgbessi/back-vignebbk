"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
// services/products.service.ts
const utils_1 = require("../utils");
class ProductsService {
    // Récupérer les produits en vedette
    async getFeaturedProducts(limit = 12) {
        try {
            const featuredProducts = await utils_1.prisma.produits.findMany({
                where: {
                    OR: [
                        { cote: { gte: 16 } },
                        { promotion: { gt: 0 } },
                        { quantit__stock: { gt: 0 } },
                    ],
                    disponible: true,
                },
                include: {
                    regions: { select: { nom: true, pays: true } },
                    domaines: { select: { nom: true } },
                    classifications: { select: { nom: true, niveau: true } },
                    produit_cepages: {
                        include: { cepages: { select: { nom: true, type: true } } },
                    },
                    produit_images: {
                        where: { est_principale: true },
                        take: 1,
                    },
                    avis_clients: {
                        where: { statut: "approuv_" },
                        select: { note: true },
                    },
                },
                orderBy: [{ cote: "desc" }, { promotion: "desc" }],
                take: limit,
            });
            return this.formatProducts(featuredProducts);
        }
        catch (error) {
            //@ts-ignore
            throw new Error(`Erreur récupération produits vedette: ${error.message}`);
        }
    }
    // Récupérer les produits avec filtres
    async getFilteredProducts(filters = {}) {
        try {
            const { types, regions, classifications, cepages, styles, millesimes, prixRange, alcoolRange, bio, vegetalien, promotion, disponible = true, search, sortBy = "nom_asc", page = 1, limit = 12, } = filters;
            const skip = (page - 1) * limit;
            // Construction de la clause WHERE
            const where = {};
            if (types?.length)
                where.type = { in: types };
            if (regions?.length)
                where.region_id = { in: regions };
            if (classifications?.length)
                where.classification_id = { in: classifications };
            if (styles?.length)
                where.style = { in: styles };
            if (millesimes?.length)
                where.millesime = { in: millesimes };
            // Filtre par cépage
            if (cepages?.length) {
                where.produit_cepages = { some: { cepage_id: { in: cepages } } };
            }
            // Filtre par prix
            if (prixRange) {
                where.prix = {};
                if (prixRange.min !== undefined)
                    where.prix.gte = prixRange.min;
                if (prixRange.max !== undefined)
                    where.prix.lte = prixRange.max;
            }
            // Filtre par alcool
            if (alcoolRange) {
                where.teneur_alcool = {};
                if (alcoolRange.min !== undefined)
                    where.teneur_alcool.gte = alcoolRange.min;
                if (alcoolRange.max !== undefined)
                    where.teneur_alcool.lte = alcoolRange.max;
            }
            // Filtres booléens
            if (bio !== undefined)
                where.bio = bio;
            if (vegetalien !== undefined)
                where.v_g_talien = vegetalien;
            if (promotion !== undefined) {
                where.promotion = promotion ? { gt: 0 } : { equals: 0 };
            }
            if (disponible !== undefined)
                where.disponible = disponible;
            // Filtre de recherche
            if (search) {
                where.OR = [
                    { nom: { contains: search, mode: "insensitive" } },
                    { appellation: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } },
                    { domaines: { nom: { contains: search, mode: "insensitive" } } },
                    { regions: { nom: { contains: search, mode: "insensitive" } } },
                ];
            }
            // Construction du ORDER BY
            const orderBy = {};
            switch (sortBy) {
                case "prix_asc":
                    orderBy.prix = "asc";
                    break;
                case "prix_desc":
                    orderBy.prix = "desc";
                    break;
                case "note_desc":
                    orderBy.cote = "desc";
                    break;
                case "promotion_desc":
                    orderBy.promotion = "desc";
                    break;
                case "nom_asc":
                default:
                    orderBy.nom = "asc";
                    break;
            }
            // Requête principale
            const [products, totalCount] = await Promise.all([
                utils_1.prisma.produits.findMany({
                    where,
                    include: {
                        regions: { select: { nom: true, pays: true } },
                        domaines: { select: { nom: true } },
                        classifications: { select: { nom: true, niveau: true } },
                        produit_cepages: {
                            include: { cepages: { select: { nom: true, type: true } } },
                        },
                        produit_images: {
                            where: { est_principale: true },
                            take: 1,
                        },
                        avis_clients: {
                            where: { statut: "approuv_" },
                            select: { note: true },
                        },
                    },
                    orderBy,
                    skip,
                    take: limit,
                }),
                utils_1.prisma.produits.count({ where }),
            ]);
            return {
                products: this.formatProducts(products),
                pagination: {
                    page,
                    limit,
                    totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                    hasNext: page * limit < totalCount,
                    hasPrev: page > 1,
                },
            };
        }
        catch (error) {
            //@ts-ignore
            throw new Error(`Erreur récupération produits filtrés: ${error.message}`);
        }
    }
    // Récupérer un produit par ID
    async getProductById(id) {
        try {
            const product = await utils_1.prisma.produits.findUnique({
                where: { id },
                include: {
                    regions: true,
                    domaines: true,
                    classifications: true,
                    produit_cepages: { include: { cepages: true } },
                    produit_images: { orderBy: { ordre_affichage: "asc" } },
                    avis_clients: {
                        where: { statut: "approuv_" },
                        include: { utilisateurs: { select: { nom: true, pr_nom: true } } },
                        orderBy: { cr___le: "desc" },
                    },
                    produit_accords: { include: { accords_mets: true } },
                },
            });
            if (!product) {
                throw new Error("Produit non trouvé");
            }
            return this.formatProduct(product);
        }
        catch (error) {
            //@ts-ignore
            throw new Error(`Erreur récupération produit: ${error.message}`);
        }
    }
    // Formater les produits
    formatProducts(products) {
        return products.map((product) => this.formatProduct(product));
    }
    formatProduct(product) {
        const notes = product.avis_clients?.map((avis) => avis.note) || [];
        const note_moyenne = notes.length > 0
            ? notes.reduce((a, b) => a + b, 0) / notes.length
            : 0;
        const imageUrl = product.produit_images?.[0]?.url || null;
        const cepages = product.produit_cepages?.map((pc) => ({
            nom: pc.cepages.nom,
            type: pc.cepages.type,
            pourcentage: pc.pourcentage,
            role: pc.r_le,
        })) || [];
        return {
            id: product.id,
            nom: product.nom,
            type: product.type,
            cat_gorie: product.cat_gorie,
            region: product.regions?.nom,
            domaine: product.domaines?.nom,
            appellation: product.appellation,
            teneur_alcool: product.teneur_alcool,
            taille_bouteille: product.taille_bouteille,
            style: product.style,
            prix: product.prix,
            promotion: product.promotion,
            cote: product.cote,
            millesime: product.millesime,
            description: product.description,
            caract_ristiques: product.caract_ristiques,
            bio: product.bio,
            v_g_talien: product.v_g_talien,
            quantit__stock: product.quantit__stock,
            images: product.produit_images?.map((img) => img.url) ||
                [imageUrl].filter(Boolean),
            note_moyenne: parseFloat(note_moyenne.toFixed(1)),
            nombre_avis: notes.length,
            cepages,
            classification: product.classifications?.nom,
            niveau_classification: product.classifications?.niveau,
            conseils_degustation: product.conseils_d_gustation,
            temperature_service: product.temp_rature_service,
        };
    }
}
exports.ProductsService = ProductsService;
