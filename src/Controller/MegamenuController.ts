import { prisma } from "../utils";

export const getWineTypes = async () => {
  try {
    const wineTypes = await prisma.produits.groupBy({
      by: ["style"],
      where: {
        style: {
          in: ["vin_rouge", "vin_rose", "vin_blanc"],
        },
      },
      _count: {
        _all: true,
      },
    });

    return wineTypes.map((item: any) => ({
      name: item.style,
      count: item._count._all,
    }));
  } catch (error) {
    console.error("Erreur récupération types de vins:", error);
    return [];
  }
};

export const getWineRegions = async () => {
  try {
    const regions = await prisma.regions.findMany({
      where: {
        produits: {
          some: {
            type: "vin",
          },
        },
      },
      select: {
        nom: true,
        id: true,
        _count: {
          select: {
            produits: {
              where: {
                type: "vin",
              },
            },
          },
        },
      },
      orderBy: {
        nom: "asc",
      },
      take: 10, // Limite pour le menu
    });

    return regions.map((region: any) => ({
      id: region.id,
      name: region.nom,
      count: region._count.produits,
    }));
  } catch (error) {
    console.error("Erreur récupération régions:", error);
    return [];
  }
};

// Récupérer les cépages populaires
export const getPopularCepages = async () => {
  try {
    const cepages = await prisma.cepages.findMany({
      where: {
        produit_cepages: {
          some: {
            produits: {
              type: "vin",
            },
          },
        },
      },
      select: {
        nom: true,
        id: true,
        type: true,
        _count: {
          select: {
            produit_cepages: {
              where: {
                produits: {
                  type: "vin",
                },
              },
            },
          },
        },
      },
      orderBy: {
        produit_cepages: {
          _count: "desc",
        },
      },
      take: 8, // Top 8 cépages
    });

    return cepages.map((cepage: any) => ({
      id: cepage.id,
      name: cepage.nom,
      type: cepage.type,
      count: cepage._count.produit_cepages,
    }));
  } catch (error) {
    console.error("Erreur récupération cépages:", error);
    return [];
  }
};

// Fonction utilitaire pour formater les URLs
const formatUrl = (
  type: string,
  value: string | number,
  id?: number,
  label?: string
): string => {
  const slug = String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const basePaths: Record<string, string> = {
    vin_rouge: "vins/rouges",
    vin_blanc: "vins/blancs",
    vin_rose: "vins/roses",
    region: "vins/region",
    cepage: "vins/cepage",
    classification: "grands-vins/classification",
    domaine: "grands-vins/domaine",
    millesime: "grands-vins/millesime",
    champagne_type: "champagnes/type",
    champagne_style: "champagnes/style",
    champagne_maison: "champagnes/maison",
    cognac_categorie: "spiritueux/cognac/categorie",
    cognac_region: "spiritueux/cognac/region",
    spiritueux_type: "spiritueux",
  };
  if (id !== undefined && id !== null) {
    return `/${basePaths[type] || type}/${slug}/${id}`;
  } else {
    return `/${basePaths[type] || type}/${slug}`;
  }
};

export const getWineMegaMenu = async () => {
  try {
    const [types, regions, cepages] = await Promise.all([
      getWineTypes(),
      getWineRegions(),
      getPopularCepages(),
    ]);

    const megaMenu = {
      title: "Nos Vins",
      categories: [
        {
          name: "Par Type",
          items: types.map((type: any) => ({
            label:
              type.name === "vin_rouge"
                ? "Vins Rouges"
                : type.name === "vin_blanc"
                ? "Vins Blancs"
                : type.name === "vin_rose"
                ? "Vins Rosés"
                : type.name,
            count: type.count,
            url: formatUrl(type.name, type.name),
          })),
        },
        {
          name: "Par Région",
          items: regions.map((region: any) => ({
            id: region.id,
            label: region.name,
            count: region.count,
            url: formatUrl("region", region.name, region.id),
          })),
        },
        {
          name: "Par Cépage",
          items: cepages.map((cepage: any) => ({
            id: cepage.id,
            label: cepage.name,
            count: cepage.count,
            type: cepage.type,
            url: formatUrl("cepage", cepage.name, cepage.id),
          })),
        },
      ],
    };

    return megaMenu;
  } catch (error) {
    console.error("Erreur génération mega menu vins:", error);

    // Retourner un menu par défaut en cas d'erreur
    return {
      // title: "Nos Vins",
      // categories: [
      //   {
      //     name: "Par Type",
      //     items: [
      //       { label: "Vins Rouges", count: 0, url: "/vins/rouges" },
      //       { label: "Vins Blancs", count: 0, url: "/vins/blancs" },
      //       { label: "Vins Rosés", count: 0, url: "/vins/roses" },
      //     ],
      //   },
      //   {
      //     name: "Par Région",
      //     items: [
      //       { label: "Bordeaux", count: 0, url: "/vins/bordeaux" },
      //       { label: "Bourgogne", count: 0, url: "/vins/bourgogne" },
      //       { label: "Vallée du Rhône", count: 0, url: "/vins/rhone" },
      //     ],
      //   },
      // ],
    };
  }
};

// Récupérer le mega menu des Grands Vins
export const getGrandWinesMegaMenu = async () => {
  try {
    // Récupérer les classifications
    const classifications = await prisma.classifications.findMany({
      where: {
        produits: {
          some: {
            type: "vin",
          },
        },
      },
      select: {
        nom: true,
        niveau: true,
        id: true,
        _count: {
          select: {
            produits: {
              where: {
                type: "vin",
              },
            },
          },
        },
      },
      orderBy: {
        niveau: "asc",
      },
    });

    // Récupérer les domaines prestigieux
    const prestigiousDomains = await prisma.domaines.findMany({
      where: {
        produits: {
          some: {
            OR: [{ classification_id: { not: null } }, { cote: { gte: 4.0 } }],
          },
        },
      },
      select: {
        nom: true,
        id: true,
        _count: {
          select: {
            produits: true,
          },
        },
      },
      take: 5,
    });

    // Récupérer les millésimes exceptionnels
    const exceptionalVintages = await prisma.produits.groupBy({
      by: ["millesime"],
      where: {
        type: "vin",
        millesime: { not: null },
        cote: { gte: 4.0 },
      },
      _count: {
        id: true,
      },
      orderBy: {
        millesime: "desc",
      },
      take: 5,
    });

    return {
      title: "Grands Crus et Vins de Prestige",
      categories: [
        {
          name: "Classifications",
          items: classifications.map((cls) => ({
            label: cls.nom,
            count: cls._count.produits,
            url: formatUrl("classification", cls.nom, cls.id),
          })),
        },
        {
          name: "Domaines Prestigieux",
          items: prestigiousDomains.map((domain) => ({
            label: domain.nom,
            count: domain._count.produits,
            url: formatUrl("domaine", domain.nom, domain?.id),
          })),
        },
        {
          name: "Millesimes",
          items: exceptionalVintages.map((vintage) => ({
            label: `Vins ${vintage.millesime}`,
            count: vintage._count.id,
            url: formatUrl("millesime", vintage.millesime ?? "unknown"),
          })),
        },
      ],
    };
  } catch (error) {
    console.error("Erreur récupération mega menu grands vins:", error);
    return [];
  }
};

// Récupérer le mega menu des Champagnes
export const getChampagneMegaMenu = async () => {
  try {
    // Récupérer les types de champagne
    const champagneTypes = await prisma.champagne_details.groupBy({
      by: ["type_champagne"],
      where: {
        produits: {
          type: "champagne",
        },
      },
      _count: {
        produit_id: true,
      },
    });

    // Récupérer les styles de champagne
    const champagneStyles = await prisma.champagne_details.groupBy({
      by: ["style_champagne"],
      where: {
        produits: {
          type: "champagne",
        },
      },
      _count: {
        produit_id: true,
      },
    });

    // Récupérer les maisons de champagne
    const champagneHouses = await prisma.champagne_details.groupBy({
      by: ["maison"],
      where: {
        produits: {
          type: "champagne",
        },
        maison: { not: null },
      },
      _count: {
        produit_id: true,
      },
      orderBy: {
        _count: {
          produit_id: "desc",
        },
      },
      take: 5,
    });

    return {
      title: "Champagnes et Bulles",
      categories: [
        {
          name: "Types de Champagne",
          items: champagneTypes.map((type) => ({
            label: type.type_champagne?.replace(/_/g, " ") || "Autre",
            count: type._count.produit_id,
            url: formatUrl("champagne_type", type.type_champagne || "autre"),
          })),
        },
        {
          name: "Styles",
          items: champagneStyles.map((style) => ({
            label: style.style_champagne?.replace(/_/g, " ") || "Autre",
            count: style._count.produit_id,
            url: formatUrl("champagne_style", style.style_champagne || "autre"),
          })),
        },
        {
          name: "Maisons Renommées",
          items: champagneHouses.map((house) => ({
            label: house.maison || "Maison inconnue",
            count: house._count.produit_id,
            url: formatUrl(
              "champagne_maison",
              house.maison || "maison-inconnue"
            ),
          })),
        },
      ],
    };
  } catch (error) {
    console.error("Erreur récupération mega menu champagnes:", error);
    return [];
  }
};

// Récupérer le mega menu des Spiritueux
export const getSpiritsMegaMenu = async () => {
  try {
    // Récupérer les catégories de cognac
    const cognacCategories = await prisma.cognac_details.groupBy({
      by: ["cat_gorie__ge"],
      where: {
        produits: {
          type: "cognac",
        },
      },
      _count: {
        produit_id: true,
      },
    });

    // Récupérer les régions de cognac
    const cognacRegions = await prisma.cognac_details.groupBy({
      by: ["r_gion_cognac"],
      where: {
        produits: {
          type: "cognac",
        },
      },
      _count: {
        produit_id: true,
      },
    });

    // Récupérer les autres spiritueux (non cognac)
    const otherSpirits = await prisma.produits.groupBy({
      by: ["type"],
      where: {
        type: {
          in: ["cognac"],
        },
      },
      _count: {
        id: true,
      },
    });

    return {
      title: "Spiritueux et Alcools",
      categories: [
        {
          name: "Cognac",
          items: cognacCategories.map((cat) => ({
            label: cat.cat_gorie__ge?.replace(/_/g, " ") || "Autre",
            count: cat._count.produit_id,
            url: formatUrl("cognac_categorie", cat.cat_gorie__ge || "autre"),
          })),
        },
        {
          name: "Régions Cognac",
          items: cognacRegions.map((region) => ({
            label: region.r_gion_cognac?.replace(/_/g, " ") || "Autre",
            count: region._count.produit_id,
            url: formatUrl("cognac_region", region.r_gion_cognac || "autre"),
          })),
        },
        {
          name: "Autres Spiritueux",
          items: otherSpirits.map((spirit) => ({
            label:
              spirit.type?.charAt(0).toUpperCase() + spirit.type?.slice(1) ||
              "Autre",
            count: spirit?._count.id || 0,
            url: formatUrl("spiritueux_type", spirit.type || "autre"),
          })),
        },
      ],
    };
  } catch (error) {
    console.error("Erreur récupération mega menu spiritueux:", error);
    return [];
  }
};

// Fonction pour récupérer tous les mega menus en parallèle
export const getAllMegaMenus = async () => {
  try {
    const [wines, grandWines, champagnes, spirits] = await Promise.all([
      getWineMegaMenu(),
      getGrandWinesMegaMenu(),
      getChampagneMegaMenu(),
      getSpiritsMegaMenu(),
    ]);

    //console.log(wines, grandWines, champagnes, spirits);

    return {
      VINS: wines,
      "GRANDS VINS": grandWines,
      CHAMPAGNES: champagnes,
      SPIRITUEUX: spirits,
    };
  } catch (error) {
    console.error("Erreur récupération de tous les mega menus:", error);
    return {};
  }
};

// const getDefaultAllMegaMenus = () => ({
//   VINS: {
//     title: "Nos Vins",
//     categories: [
//       {
//         name: "Par Type",
//         items: [
//           { label: "Vins Rouges", count: 0, url: "/vins/rouges" },
//           { label: "Vins Blancs", count: 0, url: "/vins/blancs" },
//           { label: "Vins Rosés", count: 0, url: "/vins/roses" },
//         ],
//       },
//       {
//         name: "Par Région",
//         items: [
//           { label: "Bordeaux", count: 0, url: "/vins/bordeaux" },
//           { label: "Bourgogne", count: 0, url: "/vins/bourgogne" },
//           { label: "Vallée du Rhône", count: 0, url: "/vins/rhone" },
//         ],
//       },
//     ],
//   },
//   "GRANDS VINS": {
//     title: "Grands Crus et Vins de Prestige",
//     categories: [
//       {
//         name: "Classifications",
//         items: [
//           { label: "Grand Cru", count: 0, url: "/grands-vins/grand-cru" },
//           { label: "Premier Cru", count: 0, url: "/grands-vins/premier-cru" },
//           { label: "Cru Classé", count: 0, url: "/grands-vins/cru-classe" },
//         ],
//       },
//     ],
//   },
//   CHAMPAGNES: {
//     title: "Champagnes et Bulles",
//     categories: [
//       {
//         name: "Types de Champagne",
//         items: [
//           { label: "Brut", count: 0, url: "/champagnes/brut" },
//           { label: "Extra Brut", count: 0, url: "/champagnes/extra-brut" },
//           { label: "Sec", count: 0, url: "/champagnes/sec" },
//         ],
//       },
//     ],
//   },
//   SPIRITUEUX: {
//     title: "Spiritueux et Alcools",
//     categories: [
//       {
//         name: "Cognac",
//         items: [
//           { label: "VS", count: 0, url: "/spiritueux/cognac/vs" },
//           { label: "VSOP", count: 0, url: "/spiritueux/cognac/vsop" },
//           { label: "XO", count: 0, url: "/spiritueux/cognac/xo" },
//         ],
//       },
//     ],
//   },
// });
