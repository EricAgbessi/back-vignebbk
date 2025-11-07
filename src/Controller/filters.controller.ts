// services/filters.service.ts

import { prisma } from "../utils";

export class FiltersService {
  // Récupérer tous les filtres disponibles
  async getAllFilters() {
    try {
      const [
        types,
        categories,
        regions,
        domaines,
        classifications,
        cepages,
        styles,
        prixRanges,
        millesimes,
        alcoolRanges,
        champagneTypes,
        champagneStyles,
        cognacCategories,
        cognacRegions,
        accordsCategories,
      ] = await Promise.all([
        this.getProductTypes(),
        this.getCategories(),
        this.getRegions(),
        this.getDomaines(),
        this.getClassifications(),
        this.getCepages(),
        this.getStyles(),
        this.getPrixRanges(),
        this.getMillesimes(),
        this.getAlcoolRanges(),
        this.getChampagneTypes(),
        this.getChampagneStyles(),
        this.getCognacCategories(),
        this.getCognacRegions(),
        this.getAccordsCategories(),
      ]);

      return {
        types,
        categories,
        regions,
        domaines,
        classifications,
        cepages,
        styles,
        prixRanges,
        millesimes,
        alcoolRanges,
        champagneTypes,
        champagneStyles,
        cognacCategories,
        cognacRegions,
        accordsCategories,
        labels: {
          bio: await this.getProductCount({ bio: true }),
          vegetalien: await this.getProductCount({ v_g_talien: true }),
          promotion: await this.getProductCount({ promotion: { gt: 0 } }),
          disponible: await this.getProductCount({ disponible: true }),
        },
      };
    } catch (error) {
      throw new Error(
        `Erreur lors de la récupération des filtres: ${(error as any)?.message}`
      );
    }
  }

  // Types de produits
  private async getProductTypes() {
    const types = await prisma.produits.groupBy({
      by: ["type"],
      _count: { id: true },
      orderBy: { type: "asc" },
    });

    return types.map((item) => ({
      value: item.type,
      label: this.formatLabel(item.type),
      count: item._count.id,
    }));
  }

  // Catégories
  private async getCategories() {
    const categories = await prisma.produits.groupBy({
      by: ["cat_gorie"],
      where: { cat_gorie: { not: null } },
      _count: { id: true },
      orderBy: { cat_gorie: "asc" },
    });

    return categories.map((item) => ({
      value: item.cat_gorie,
      label: this.formatLabel(item.cat_gorie),
      count: item._count.id,
    }));
  }

  // Régions
  private async getRegions() {
    const regions = await prisma.regions.findMany({
      where: {
        produits: { some: {} },
      },
      select: {
        id: true,
        nom: true,
        pays: true,
        climat: true,
        _count: {
          select: { produits: true },
        },
      },
      orderBy: { nom: "asc" },
    });

    return regions.map((region) => ({
      value: region.id,
      label: region.nom,
      pays: region.pays,
      climat: region.climat,
      count: region._count.produits,
    }));
  }

  // Domaines
  private async getDomaines() {
    const domaines = await prisma.domaines.findMany({
      where: {
        produits: { some: {} },
      },
      select: {
        id: true,
        nom: true,
        propri_taire: true,
        ann_e_fondation: true,
        _count: {
          select: { produits: true },
        },
      },
      orderBy: { nom: "asc" },
      take: 50, // Limite pour éviter trop d'options
    });

    return domaines.map((domaine) => ({
      value: domaine.id,
      label: domaine.nom,
      proprietaire: domaine.propri_taire,
      anneeFondation: domaine.ann_e_fondation,
      count: domaine._count.produits,
    }));
  }

  // Classifications
  private async getClassifications() {
    const classifications = await prisma.classifications.findMany({
      where: {
        produits: { some: {} },
      },
      select: {
        id: true,
        nom: true,
        niveau: true,
        _count: {
          select: { produits: true },
        },
      },
      orderBy: { niveau: "asc" },
    });

    return classifications.map((classification) => ({
      value: classification.id,
      label: classification.nom,
      niveau: classification.niveau,
      count: classification._count.produits,
    }));
  }

  // Cépages
  private async getCepages() {
    const cepages = await prisma.cepages.findMany({
      where: {
        produit_cepages: { some: {} },
      },
      select: {
        id: true,
        nom: true,
        type: true,
        couleur_baie: true,
        origine: true,
        _count: {
          select: { produit_cepages: true },
        },
      },
      orderBy: { nom: "asc" },
    });

    return cepages.map((cepage) => ({
      value: cepage.id,
      label: cepage.nom,
      type: cepage.type,
      couleurBaie: cepage.couleur_baie,
      origine: cepage.origine,
      count: cepage._count.produit_cepages,
    }));
  }

  // Styles
  private async getStyles() {
    const styles = await prisma.produits.groupBy({
      by: ["style"],
      where: { style: { not: null } },
      _count: { id: true },
      orderBy: { style: "asc" },
    });

    return styles.map((item) => ({
      value: item.style,
      label: this.formatLabel(item.style),
      count: item._count.id,
    }));
  }

  // Plages de prix
  private async getPrixRanges() {
    const prixStats = await prisma.produits.aggregate({
      _min: { prix: true },
      _max: { prix: true },
      _avg: { prix: true },
    });

    const ranges = [
      { min: 0, max: 20, label: "Moins de 20€" },
      { min: 20, max: 50, label: "20€ - 50€" },
      { min: 50, max: 100, label: "50€ - 100€" },
      { min: 100, max: Infinity, label: "Plus de 100€" },
    ];

    const rangesWithCount = await Promise.all(
      ranges.map(async (range) => {
        const count = await this.getProductCount({
          prix: {
            gte: range.min,
            ...(range.max !== Infinity && { lte: range.max }),
          },
        });
        return { ...range, count };
      })
    );

    return {
      ranges: rangesWithCount.filter((range) => range.count > 0),
      stats: {
        min: prixStats._min.prix,
        max: prixStats._max.prix,
        avg: prixStats._avg.prix,
      },
    };
  }

  // Millésimes
  private async getMillesimes() {
    const millesimes = await prisma.produits.groupBy({
      by: ["millesime"],
      where: { millesime: { not: null } },
      _count: { id: true },
      orderBy: { millesime: "desc" },
    });

    return millesimes.map((item) => ({
      value: item.millesime,
      label: item?.millesime?.toString(),
      count: item._count.id,
    }));
  }

  // Plages d'alcool
  private async getAlcoolRanges() {
    const ranges = [
      { min: 0, max: 11, label: "Moins de 11%" },
      { min: 11, max: 13, label: "11% - 13%" },
      { min: 13, max: 15, label: "13% - 15%" },
      { min: 15, max: Infinity, label: "Plus de 15%" },
    ];

    const rangesWithCount = await Promise.all(
      ranges.map(async (range) => {
        const count = await this.getProductCount({
          teneur_alcool: {
            gte: range.min,
            ...(range.max !== Infinity && { lte: range.max }),
          },
        });
        return { ...range, count };
      })
    );

    return rangesWithCount.filter((range) => range.count > 0);
  }

  // Types de Champagne
  private async getChampagneTypes() {
    const types = await prisma.champagne_details.groupBy({
      by: ["type_champagne"],
      _count: { produit_id: true },
      orderBy: { type_champagne: "asc" },
    });

    return types.map((item) => ({
      value: item.type_champagne,
      label: this.formatLabel(item.type_champagne),
      count: item._count.produit_id,
    }));
  }

  // Styles de Champagne
  private async getChampagneStyles() {
    const styles = await prisma.champagne_details.groupBy({
      by: ["style_champagne"],
      _count: { produit_id: true },
      orderBy: { style_champagne: "asc" },
    });

    return styles.map((item) => ({
      value: item.style_champagne,
      label: this.formatLabel(item.style_champagne),
      count: item._count.produit_id,
    }));
  }

  // Catégories de Cognac
  private async getCognacCategories() {
    const categories = await prisma.cognac_details.groupBy({
      by: ["cat_gorie__ge"],
      _count: { produit_id: true },
      orderBy: { cat_gorie__ge: "asc" },
    });

    return categories.map((item) => ({
      value: item.cat_gorie__ge,
      label: this.formatLabel(item.cat_gorie__ge),
      count: item._count.produit_id,
    }));
  }

  // Régions de Cognac
  private async getCognacRegions() {
    const regions = await prisma.cognac_details.groupBy({
      by: ["r_gion_cognac"],
      _count: { produit_id: true },
      orderBy: { r_gion_cognac: "asc" },
    });

    return regions.map((item) => ({
      value: item.r_gion_cognac,
      label: this.formatLabel(item.r_gion_cognac),
      count: item._count.produit_id,
    }));
  }

  // Catégories d'accords mets
  private async getAccordsCategories() {
    const categories = await prisma.accords_mets.groupBy({
      by: ["cat_gorie"],
      _count: { id: true },
      orderBy: { cat_gorie: "asc" },
    });

    return categories.map((item) => ({
      value: item.cat_gorie,
      label: this.formatLabel(item.cat_gorie),
      count: item._count.id,
    }));
  }

  // Compteur de produits avec filtres
  private async getProductCount(where: any) {
    return await prisma.produits.count({ where });
  }

  // Formateur de labels
  private formatLabel(label: string | null): string {
    if (!label) return "Non spécifié";
    return label
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .replace(/Ml/g, "ml")
      .replace(/Cl/g, "cl");
  }
}
