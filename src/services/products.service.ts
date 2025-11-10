// services/products.service.ts
import { prisma } from "../utils";

export interface ProductFilters {
  types?: string[];
  regions?: number[];
  classifications?: number[];
  cepages?: number[];
  styles?: string[];
  millesimes?: number[];
  prixRange?: { min?: number; max?: number };
  alcoolRange?: { min?: number; max?: number };
  bio?: boolean;
  vegetalien?: boolean;
  promotion?: boolean;
  disponible?: boolean;
  search?: string;
  sortBy?:
    | "prix_asc"
    | "prix_desc"
    | "note_desc"
    | "nom_asc"
    | "promotion_desc";
  page?: number;
  limit?: number;
}

export class ProductsService {
  // Récupérer les produits en vedette
  async getFeaturedProducts(limit: number = 12) {
    try {
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

      return this.formatProducts(featuredProducts);
    } catch (error) {
      //@ts-ignore
      throw new Error(`Erreur récupération produits vedette: ${error.message}`);
    }
  }

  // Récupérer les produits avec filtres
  async getFilteredProducts(filters: ProductFilters = {}) {
    try {
      const {
        types,
        regions,
        classifications,
        cepages,
        styles,
        millesimes,
        prixRange,
        alcoolRange,
        bio,
        vegetalien,
        promotion,
        disponible = true,
        search,
        sortBy = "nom_asc",
        page = 1,
        limit = 12,
      } = filters;

      const skip = (page - 1) * limit;

      // Construction de la clause WHERE
      const where: any = {};

      if (types?.length) where.type = { in: types };
      if (regions?.length) where.region_id = { in: regions };
      if (classifications?.length)
        where.classification_id = { in: classifications };
      if (styles?.length) where.style = { in: styles };
      if (millesimes?.length) where.millesime = { in: millesimes };

      // Filtre par cépage
      if (cepages?.length) {
        where.produit_cepages = { some: { cepage_id: { in: cepages } } };
      }

      // Filtre par prix
      if (prixRange) {
        where.prix = {};
        if (prixRange.min !== undefined) where.prix.gte = prixRange.min;
        if (prixRange.max !== undefined) where.prix.lte = prixRange.max;
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
      if (bio !== undefined) where.bio = bio;
      if (vegetalien !== undefined) where.v_g_talien = vegetalien;
      if (promotion !== undefined) {
        where.promotion = promotion ? { gt: 0 } : { equals: 0 };
      }
      if (disponible !== undefined) where.disponible = disponible;

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
      const orderBy: any = {};
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
    } catch (error) {
      //@ts-ignore

      throw new Error(`Erreur récupération produits filtrés: ${error.message}`);
    }
  }

  // Récupérer un produit par ID
  async getProductById(id: number) {
    try {
      const product = await prisma.produits.findUnique({
        where: { id },
        include: {
          regions: true,
          domaines: true,
          classifications: true,
          produit_cepages: {
            include: {
              cepages: true,
            },
            orderBy: { ordre_m_lange: "asc" },
          },
          produit_images: {
            orderBy: { ordre_affichage: "asc" },
          },
          avis_clients: {
            where: { statut: "approuv_" },
            include: {
              utilisateurs: {
                select: {
                  nom: true,
                  pr_nom: true,
                },
              },
            },
            orderBy: { cr___le: "desc" },
          },
          produit_accords: {
            include: {
              accords_mets: true,
            },
          },
          // Inclure les détails spécifiques selon le type
          champagne_details: true,
          cognac_details: true,
          // Inclure les favoris pour statistiques
          favoris: {
            select: {
              id: true,
            },
          },
          // Inclure l'historique des stocks récent
          historique_stocks: {
            orderBy: { cr___le: "desc" },
            take: 10,
          },
        },
      });

      if (!product) {
        throw new Error("Produit non trouvé");
      }

      return this.formatProductWithDetails(product);
    } catch (error) {
      //@ts-ignore
      throw new Error(`Erreur récupération produit: ${error.message}`);
    }
  }

  private formatProductWithDetails(product: any) {
    // Calculer la note moyenne
    const averageRating =
      product.avis_clients.length > 0
        ? product.avis_clients.reduce(
            (acc: number, avis: any) => acc + avis.note,
            0
          ) / product.avis_clients.length
        : null;

    // Compter les favoris
    const favoritesCount = product.favoris.length;

    // Formater les cépages avec leurs rôles
    const formattedCepages = product.produit_cepages.map((pc: any) => ({
      id: pc.cepages.id,
      nom: pc.cepages.nom,
      type: pc.cepages.type,
      pourcentage: pc.pourcentage,
      ordre: pc.ordre_m_lange,
      role: pc.r_le,
    }));

    // Formater les accords mets-vins
    const formattedAccords = product.produit_accords.map((pa: any) => ({
      id: pa.accords_mets.id,
      nom: pa.accords_mets.nom,
      categorie: pa.accords_mets.cat_gorie,
      sousCategorie: pa.accords_mets.sous_cat_gorie,
      forceAccord: pa.force_accord,
      commentaire: pa.commentaire,
    }));

    // Formater les images
    const formattedImages = product.produit_images.map((img: any) => ({
      id: img.id,
      url: img.url,
      estPrincipale: img.est_principale,
      texteAlternatif: img.texte_alternatif,
      ordre: img.ordre_affichage,
      type: img.type_image,
    }));

    // Formater les avis
    const formattedAvis = product.avis_clients.map((avis: any) => ({
      id: avis.id,
      note: avis.note,
      commentaire: avis.commentaire,
      avantages: avis.avantages,
      inconvenients: avis.inconv_nients,
      recommande: avis.recommand_,
      date: avis.cr___le,
      utilisateur: {
        nom: avis.utilisateurs.nom,
        prenom: avis.utilisateurs.pr_nom,
      },
    }));

    // Structure de base du produit
    const baseProduct = {
      id: product.id,
      nom: product.nom,
      type: product.type,
      categorie: product.cat_gorie,
      region: product.regions,
      domaine: product.domaines,
      classification: product.classifications,
      style: product.style,
      appellation: product.appellation,
      teneurAlcool: product.teneur_alcool,
      temperatureService: product.temp_rature_service,
      tailleBouteille: product.taille_bouteille,
      prix: product.prix,
      cote: product.cote,
      millesime: product.millesime,
      garderJusqua: product.garder_jusqu_,
      allergenes: product.allerg_nes,
      description: product.description,
      caracteristiques: product.caract_ristiques,
      conseilsDegustation: product.conseils_d_gustation,
      ordreAffichage: product.ordre_affichage,
      disponible: product.disponible,
      quantiteStock: product.quantit__stock,
      seuilAlerte: product.seuil_alerte,
      promotion: product.promotion,
      datePromotion: product.date_promotion,
      bio: product.bio,
      vegetalien: product.v_g_talien,
      createdAt: product.created_at,
      updatedAt: product.updated_at,

      // Données calculées
      noteMoyenne: averageRating,
      nombreAvis: product.avis_clients.length,
      nombreFavoris: favoritesCount,

      // Relations formatées
      cepages: formattedCepages,
      accords: formattedAccords,
      images: formattedImages,
      avis: formattedAvis,
      historiqueStocks: product.historique_stocks,
    };

    // Ajouter les détails spécifiques selon le type
    switch (product.type) {
      case "champagne":
        return {
          ...baseProduct,
          detailsChampagne: product.champagne_details
            ? {
                typeChampagne: product.champagne_details.type_champagne,
                styleChampagne: product.champagne_details.style_champagne,
                niveauSucre: product.champagne_details.niveau_sucre,
                millesime: product.champagne_details.millesime,
                maison: product.champagne_details.maison,
                methodeElaboration:
                  product.champagne_details.m_thode__laboration,
                tempsPriseMousse: product.champagne_details.temps_prise_mousse,
                caracteristiquesBulle:
                  product.champagne_details.caract_ristiques_bulle,
                conseilsService: product.champagne_details.conseils_service,
              }
            : null,
        };

      case "cognac":
        return {
          ...baseProduct,
          detailsCognac: product.cognac_details
            ? {
                categorieAge: product.cognac_details.cat_gorie__ge,
                regionCognac: product.cognac_details.r_gion_cognac,
                appellation: product.cognac_details.appellation,
                ageMinimum: product.cognac_details.ge_minimum,
                methodeElevage: product.cognac_details.m_thode__l_vage,
                caracteristiquesAromatiques:
                  product.cognac_details.caract_ristiques_aromatiques,
                temperatureService: product.cognac_details.temp_rature_service,
              }
            : null,
        };

      case "vin":
      default:
        return baseProduct;
    }
  }

  // Formater les produits
  private formatProducts(products: any[]) {
    return products.map((product) => this.formatProduct(product));
  }

  private formatProduct(product: any) {
    const notes = product.avis_clients?.map((avis: any) => avis.note) || [];
    const note_moyenne =
      notes.length > 0
        ? notes.reduce((a: number, b: number) => a + b, 0) / notes.length
        : 0;

    const imageUrl = product.produit_images?.[0]?.url || null;

    const cepages =
      product.produit_cepages?.map((pc: any) => ({
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
      images:
        product.produit_images?.map((img: any) => img.url) ||
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
