import { prisma } from "../utils";
import { discountedPrice } from "./pricing";

export class FiltersService {
  async getAllFilters() {
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
      champagneMaisons,
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
      this.getChampagneMaisons(),
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
      champagneMaisons,
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
  }

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

  private async getRegions() {
    const regions = await prisma.regions.findMany({
      where: { produits: { some: {} } },
      select: {
        id: true,
        nom: true,
        pays: true,
        climat: true,
        _count: { select: { produits: true } },
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

  private async getDomaines() {
    const domaines = await prisma.domaines.findMany({
      where: { produits: { some: {} } },
      select: {
        id: true,
        nom: true,
        propri_taire: true,
        ann_e_fondation: true,
        _count: { select: { produits: true } },
      },
      orderBy: { nom: "asc" },
      take: 50,
    });

    return domaines.map((domaine) => ({
      value: domaine.id,
      label: domaine.nom,
      proprietaire: domaine.propri_taire,
      anneeFondation: domaine.ann_e_fondation,
      count: domaine._count.produits,
    }));
  }

  private async getClassifications() {
    const classifications = await prisma.classifications.findMany({
      where: { produits: { some: {} } },
      select: {
        id: true,
        nom: true,
        niveau: true,
        _count: { select: { produits: true } },
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

  private async getCepages() {
    const cepages = await prisma.cepages.findMany({
      where: { produit_cepages: { some: {} } },
      select: {
        id: true,
        nom: true,
        type: true,
        couleur_baie: true,
        origine: true,
        _count: { select: { produit_cepages: true } },
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

  private async getPrixRanges() {
    // Buckets are built and counted on the price the card shows (after the
    // promotion), the same one the listing filters on — see pricing.ts.
    const rows = await prisma.produits.findMany({ select: { prix: true, promotion: true } });
    const prices = rows
      .map((r) => discountedPrice(r.prix, r.promotion))
      .filter((p): p is number => p !== null);

    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    const avg = prices.length ? prices.reduce((s, p) => s + p, 0) / prices.length : null;

    // Build price buckets dynamically from the real catalogue range (in the
    // store currency), instead of hardcoded euro tiers. Boundaries are rounded
    // to a "nice" step so labels stay readable.
    const ranges = this.buildPriceRanges(min, max);

    const rangesWithCount = ranges.map((range) => ({
      ...range,
      count: prices.filter((p) => p >= range.min && (range.max === null || p < range.max)).length,
    }));

    return {
      ranges: rangesWithCount.filter((range) => range.count > 0),
      stats: {
        min: prices.length ? min : null,
        max: prices.length ? max : null,
        avg,
      },
    };
  }

  // Split [min, max] into ~4 buckets on rounded boundaries. Currency-agnostic:
  // works for FCFA (tens of thousands) as well as any other scale.
  private buildPriceRanges(min: number, max: number) {
    if (!(max > min)) {
      return [{ min: 0, max: null as number | null, label: "Tous les prix" }];
    }
    const niceStep = (raw: number): number => {
      const pow = Math.pow(10, Math.floor(Math.log10(raw)));
      const base = raw / pow;
      const mult = base <= 1 ? 1 : base <= 2 ? 2 : base <= 5 ? 5 : 10;
      return mult * pow;
    };
    const step = niceStep((max - min) / 4);
    const start = Math.floor(min / step) * step;
    const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

    const ranges: { min: number; max: number | null; label: string }[] = [];
    for (let i = 0; i < 4; i++) {
      const lo = start + i * step;
      const hi = i === 3 ? null : lo + step;
      if (hi !== null && hi <= min) continue;
      if (i === 0) ranges.push({ min: 0, max: hi, label: `Moins de ${fmt(hi!)} FCFA` });
      else if (hi === null) ranges.push({ min: lo, max: null, label: `Plus de ${fmt(lo)} FCFA` });
      else ranges.push({ min: lo, max: hi, label: `${fmt(lo)} - ${fmt(hi)} FCFA` });
    }
    return ranges;
  }

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

  private async getChampagneMaisons() {
    const maisons = await prisma.champagne_details.groupBy({
      by: ["maison"],
      _count: { produit_id: true },
      orderBy: { maison: "asc" },
    });

    return maisons.map((item) => ({
      value: item.maison,
      label: item.maison || "Non spécifié",
      count: item._count.produit_id,
    }));
  }

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

  private async getProductCount(where: any) {
    return await prisma.produits.count({ where });
  }

  private formatLabel(label: string | null): string {
    if (!label) return "Non spécifié";
    return label
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .replace(/Ml/g, "ml")
      .replace(/Cl/g, "cl");
  }
}
