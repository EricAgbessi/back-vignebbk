import { prisma } from "../utils";
import { ProductTransformer } from "../transformers/product.transformer";
import { ProductQuery } from "../schemas/product.schema";

export class ProductsService {
  async getFeaturedProducts(limit: number = 12) {
    const featuredProducts = await prisma.produits.findMany({
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

    return ProductTransformer.formatProducts(featuredProducts);
  }

  async getFilteredProducts(filters: ProductQuery) {
    const {
      types,
      regions,
      classifications,
      cepages,
      styles,
      millesimes,
      prixMin,
      prixMax,
      alcoolMin,
      alcoolMax,
      bio,
      vegetalien,
      promotion,
      disponible,
      search,
      sortBy,
      page,
      limit,
    } = filters;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (types?.length) where.type = { in: types };
    if (regions?.length) where.region_id = { in: regions };
    if (classifications?.length) where.classification_id = { in: classifications };
    if (styles?.length) where.style = { in: styles };
    if (millesimes?.length) where.millesime = { in: millesimes };
    if (cepages?.length) where.produit_cepages = { some: { cepage_id: { in: cepages } } };

    if (prixMin !== undefined || prixMax !== undefined) {
      where.prix = {};
      if (prixMin !== undefined) where.prix.gte = prixMin;
      if (prixMax !== undefined) where.prix.lte = prixMax;
    }

    if (alcoolMin !== undefined || alcoolMax !== undefined) {
      where.teneur_alcool = {};
      if (alcoolMin !== undefined) where.teneur_alcool.gte = alcoolMin;
      if (alcoolMax !== undefined) where.teneur_alcool.lte = alcoolMax;
    }

    if (bio !== undefined) where.bio = bio;
    if (vegetalien !== undefined) where.v_g_talien = vegetalien;
    if (promotion !== undefined) where.promotion = promotion ? { gt: 0 } : { equals: 0 };
    if (disponible !== undefined) where.disponible = disponible;

    if (search) {
      where.OR = [
        { nom: { contains: search, mode: "insensitive" } },
        { appellation: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { domaines: { nom: { contains: search, mode: "insensitive" } } },
        { regions: { nom: { contains: search, mode: "insensitive" } } },
      ];
    }

    const orderBy: any = {};
    switch (sortBy) {
      case "prix_asc": orderBy.prix = "asc"; break;
      case "prix_desc": orderBy.prix = "desc"; break;
      case "note_desc": orderBy.cote = "desc"; break;
      case "promotion_desc": orderBy.promotion = "desc"; break;
      case "nom_asc": default: orderBy.nom = "asc"; break;
    }

    const [products, totalCount] = await Promise.all([
      prisma.produits.findMany({
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
      prisma.produits.count({ where }),
    ]);

    return {
      products: ProductTransformer.formatProducts(products),
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

  async getProductById(id: number) {
    const product = await prisma.produits.findUnique({
      where: { id },
      include: {
        regions: true,
        domaines: true,
        classifications: true,
        produit_cepages: {
          include: { cepages: true },
          orderBy: { ordre_m_lange: "asc" },
        },
        produit_images: { orderBy: { ordre_affichage: "asc" } },
        avis_clients: {
          where: { statut: "approuv_" },
          include: {
            utilisateurs: { select: { nom: true, pr_nom: true } },
          },
          orderBy: { cr___le: "desc" },
        },
        produit_accords: { include: { accords_mets: true } },
        champagne_details: true,
        cognac_details: true,
        favoris: { select: { id: true } },
        historique_stocks: { orderBy: { cr___le: "desc" }, take: 10 },
      },
    });

    if (!product) return null;

    return ProductTransformer.formatProductWithDetails(product);
  }
}
