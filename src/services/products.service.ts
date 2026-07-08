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

  async searchProducts(query: string, limit: number = 5) {
    const searchTerm = `%${query}%`;
    
    // 1. Find IDs using raw SQL for case-insensitive search to handle MySQL collation differences
    const results = await prisma.$queryRaw<Array<{ id: number }>>`
      SELECT p.id 
      FROM produits p
      LEFT JOIN domaines d ON p.domaine_id = d.id
      LEFT JOIN regions r ON p.region_id = r.id
      WHERE 
        p.disponible = 1 AND (
          LOWER(p.nom) LIKE LOWER(${searchTerm}) OR
          LOWER(p.appellation) LIKE LOWER(${searchTerm}) OR
          LOWER(p.description) LIKE LOWER(${searchTerm}) OR
          LOWER(d.nom) LIKE LOWER(${searchTerm}) OR
          LOWER(r.nom) LIKE LOWER(${searchTerm})
        )
      LIMIT ${limit}
    `;

    const ids = results.map(r => r.id);

    if (ids.length === 0) return [];

    // 2. Fetch full details with Prisma
    const products = await prisma.produits.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        nom: true,
        type: true,
        appellation: true,
        produit_images: {
          where: { est_principale: true },
          take: 1,
          select: { url: true },
        },
      },
    });

    return products.map((p) => ({
      id: p.id,
      nom: p.nom,
      type: p.type,
      appellation: p.appellation,
      image: p.produit_images[0]?.url || null,
    }));
  }

  async getFilteredProducts(filters: ProductQuery) {
    const {
      types,
      regions,
      domaines,
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
      champagneTypes,
      champagneStyles,
      champagneMaisons,
      cognacCategories,
      cognacRegions,
    } = filters;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (types?.length) where.type = { in: types };
    if (regions?.length) where.region_id = { in: regions };
    if (domaines?.length) where.domaine_id = { in: domaines };
    if (classifications?.length) where.classification_id = { in: classifications };
    if (styles?.length) where.style = { in: styles };
    if (millesimes?.length) where.millesime = { in: millesimes };
    if (cepages?.length) where.produit_cepages = { some: { cepage_id: { in: cepages } } };

    if (champagneTypes?.length) where.champagne_details = { type_champagne: { in: champagneTypes } };
    if (champagneStyles?.length) where.champagne_details = { style_champagne: { in: champagneStyles } };
    if (champagneMaisons?.length) where.champagne_details = { maison: { in: champagneMaisons } };

    if (cognacCategories?.length) where.cognac_details = { cat_gorie__ge: { in: cognacCategories } };
    if (cognacRegions?.length) where.cognac_details = { r_gion_cognac: { in: cognacRegions } };

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
        { nom: { contains: search } },
        { appellation: { contains: search } },
        { description: { contains: search } },
        { domaines: { nom: { contains: search } } },
        { regions: { nom: { contains: search } } },
      ];
    }

    const orderBy: any = {};
    switch (sortBy) {
      case "prix_asc": orderBy.prix = "asc"; break;
      case "prix_desc": orderBy.prix = "desc"; break;
      case "note_desc": orderBy.cote = "desc"; break;
      case "promotion_desc": orderBy.promotion = "desc"; break;
      case "nouveaute": orderBy.created_at = "desc"; break;
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

  async createProduct(data: any) {
    return prisma.$transaction(async (tx) => {
      // 1. Create base product
      const {
        champagne_details,
        cognac_details,
        produit_cepages,
        produit_accords,
        produit_images,
        // Exclude specific detail fields that might be present in the root data object
        cat_gorie__ge, r_gion_cognac, ge_minimum, m_thode__l_vage,
        type_champagne, style_champagne, niveau_sucre, maison, m_thode__laboration, caract_ristiques_bulle,
        ...productData
      } = data;

      // Clean up nullable fields
      if (productData.region_id === "") productData.region_id = null;
      if (productData.domaine_id === "") productData.domaine_id = null;
      if (productData.classification_id === "") productData.classification_id = null;
      if (productData.millesime === "" || productData.millesime === undefined) productData.millesime = null;
      else productData.millesime = Number(productData.millesime);

      const { region_id, domaine_id, classification_id, ...restProductData } = productData;
      const createData: any = { ...restProductData };

      if (region_id) createData.regions = { connect: { id: Number(region_id) } };
      if (domaine_id) createData.domaines = { connect: { id: Number(domaine_id) } };
      if (classification_id) createData.classifications = { connect: { id: Number(classification_id) } };

      const product = await tx.produits.create({
        data: createData,
      });

      // 2. Create specific details
      if (product.type === "champagne" && champagne_details) {
        await tx.champagne_details.create({
          data: { ...champagne_details, produit_id: product.id },
        });
      } else if (product.type === "cognac" && cognac_details) {
        await tx.cognac_details.create({
          data: { ...cognac_details, produit_id: product.id },
        });
      }

      // 3. Link Cepages
      if (produit_cepages && produit_cepages.length > 0) {
        await tx.produit_cepages.createMany({
          data: produit_cepages.map((pc: any) => ({
            ...pc,
            produit_id: product.id,
          })),
        });
      }

      // 4. Link Accords
      if (produit_accords && produit_accords.length > 0) {
        await tx.produit_accords.createMany({
          data: produit_accords.map((pa: any) => ({
            accord_id: pa.accord_id,
            produit_id: product.id,
            force_accord: pa.force_accord,
            commentaire: pa.commentaire,
          })),
        });
      }

      // 5. Add Images
      if (produit_images && produit_images.length > 0) {
        await tx.produit_images.createMany({
          data: produit_images.map((img: any, index: number) => ({
            ...img,
            produit_id: product.id,
            ordre_affichage: index,
            est_principale: index === 0,
          })),
        });
      }

      // 6. Initial Stock History
      if (product.quantit__stock && product.quantit__stock > 0) {
        await tx.historique_stocks.create({
          data: {
            produit_id: product.id,
            ancienne_quantit_: 0,
            nouvelle_quantit_: product.quantit__stock,
            type_mouvement: "inventaire",
            raison: "Création du produit",
          },
        });
      }

      return product;
    });
  }

  async updateProduct(id: number, data: any) {
    return prisma.$transaction(async (tx) => {
      const {
        champagne_details,
        cognac_details,
        produit_cepages,
        produit_accords,
        produit_images,
        // Exclude specific detail fields that might be present in the root data object
        cat_gorie__ge, r_gion_cognac, ge_minimum, m_thode__l_vage,
        type_champagne, style_champagne, niveau_sucre, maison, m_thode__laboration, caract_ristiques_bulle,
        ...productData
      } = data;

      // Clean up nullable fields for Prisma
      if (productData.region_id === "") productData.region_id = null;
      if (productData.domaine_id === "") productData.domaine_id = null;
      if (productData.classification_id === "") productData.classification_id = null;
      if (productData.millesime === "" || productData.millesime === undefined) productData.millesime = null;
      else if (productData.millesime !== null) productData.millesime = Number(productData.millesime);

      const { region_id, domaine_id, classification_id, ...restProductData } = productData;

      const updateData: any = { ...restProductData };

      if (region_id !== undefined) {
        updateData.regions = region_id ? { connect: { id: Number(region_id) } } : { disconnect: true };
      }
      if (domaine_id !== undefined) {
        updateData.domaines = domaine_id ? { connect: { id: Number(domaine_id) } } : { disconnect: true };
      }
      if (classification_id !== undefined) {
        updateData.classifications = classification_id ? { connect: { id: Number(classification_id) } } : { disconnect: true };
      }

      // 1. Update base product
      const product = await tx.produits.update({
        where: { id },
        data: updateData,
      });

      // 2. Update details
      if (product.type === "champagne" && champagne_details) {
        await tx.champagne_details.upsert({
          where: { produit_id: id },
          create: { ...champagne_details, produit_id: id },
          update: champagne_details,
        });
      } else if (product.type === "cognac" && cognac_details) {
        await tx.cognac_details.upsert({
          where: { produit_id: id },
          create: { ...cognac_details, produit_id: id },
          update: cognac_details,
        });
      }

      // 3. Update Cepages (Delete all and recreate for simplicity, or smart diff)
      // Simplicity for now:
      if (produit_cepages) {
        await tx.produit_cepages.deleteMany({ where: { produit_id: id } });
        if (produit_cepages.length > 0) {
          await tx.produit_cepages.createMany({
            data: produit_cepages.map((pc: any) => ({
              ...pc,
              produit_id: id,
            })),
          });
        }
      }

      // 4. Update Accords
      if (produit_accords) {
        await tx.produit_accords.deleteMany({ where: { produit_id: id } });
        if (produit_accords.length > 0) {
          await tx.produit_accords.createMany({
            data: produit_accords.map((pa: any) => ({
              accord_id: pa.accord_id,
              produit_id: id,
              force_accord: pa.force_accord,
              commentaire: pa.commentaire,
            })),
          });
        }
      }

      // 5. Update Images
      if (produit_images) {
        await tx.produit_images.deleteMany({ where: { produit_id: id } });
        if (produit_images.length > 0) {
          await tx.produit_images.createMany({
            data: produit_images.map((img: any, index: number) => ({
              ...img,
              produit_id: id,
              ordre_affichage: index,
              est_principale: index === 0,
            })),
          });
        }
      }

      return product;
    });
  }

  async deleteProduct(id: number) {
    return prisma.produits.delete({ where: { id } });
  }

  async updateStock(id: number, quantity: number, type: "entr_e" | "sortie" | "inventaire" | "ajustement", reason: string) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.produits.findUnique({ where: { id } });
      if (!product) throw new Error("Produit non trouvé");

      const oldQuantity = product.quantit__stock || 0;
      const newQuantity = type === "inventaire" ? quantity : (type === "entr_e" ? oldQuantity + quantity : oldQuantity - quantity);

      await tx.produits.update({
        where: { id },
        data: { quantit__stock: newQuantity },
      });

      await tx.historique_stocks.create({
        data: {
          produit_id: id,
          ancienne_quantit_: oldQuantity,
          nouvelle_quantit_: newQuantity,
          type_mouvement: type,
          raison: reason,
        },
      });

      return { oldQuantity, newQuantity };
    });
  }
}
