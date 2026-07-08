import { z } from "zod";

export const productQuerySchema = z.object({
  types: z.string().optional().transform(v => v?.split(",")),
  regions: z.string().optional().transform(v => v?.split(",").map(Number)),
  domaines: z.string().optional().transform(v => v?.split(",").map(Number)),
  classifications: z.string().optional().transform(v => v?.split(",").map(Number)),
  cepages: z.string().optional().transform(v => v?.split(",").map(Number)),
  styles: z.string().optional().transform(v => v?.split(",")),
  millesimes: z.string().optional().transform(v => v?.split(",").map(Number)),
  prixMin: z.string().optional().transform(v => v ? parseFloat(v) : undefined),
  prixMax: z.string().optional().transform(v => v ? parseFloat(v) : undefined),
  alcoolMin: z.string().optional().transform(v => v ? parseFloat(v) : undefined),
  alcoolMax: z.string().optional().transform(v => v ? parseFloat(v) : undefined),
  bio: z.string().optional().transform(v => v === "true"),
  vegetalien: z.string().optional().transform(v => v === "true"),
  promotion: z.string().optional().transform(v => v === "true"),
  disponible: z.string().optional().default("true").transform(v => {
    if (v === "true") return true;
    if (v === "false") return false;
    return undefined;
  }),
  search: z.string().optional(),
  sortBy: z.enum(["prix_asc", "prix_desc", "note_desc", "nom_asc", "promotion_desc", "nouveaute"]).optional().default("nom_asc"),
  page: z.string().optional().default("1").transform(v => parseInt(v)),
  champagneTypes: z.string().optional().transform(v => v?.split(",")),
  champagneStyles: z.string().optional().transform(v => v?.split(",")),
  champagneMaisons: z.string().optional().transform(v => v?.split(",")),
  cognacCategories: z.string().optional().transform(v => v?.split(",")),
  cognacRegions: z.string().optional().transform(v => v?.split(",")),
  limit: z.string().optional().default("12").transform(v => parseInt(v)),
});

export type ProductQuery = z.infer<typeof productQuerySchema>;

const optionalNumberOrEmptyString = z.union([z.number(), z.string()]).optional().nullable();

const cepageItem = z.object({
  cepage_id: z.number().int().positive(),
  pourcentage: z.number().min(0).max(100).optional().nullable(),
  ordre_m_lange: z.number().int().optional().nullable(),
  r_le: z.enum(["principal", "secondaire", "assemblage"]).optional().nullable(),
}).passthrough();

const accordItem = z.object({
  accord_id: z.number().int().positive(),
  force_accord: z.enum(["excellent", "bon", "correct"]).optional().nullable(),
  commentaire: z.string().max(2000).optional().nullable(),
});

const imageItem = z.object({
  url: z.string().min(1).max(2048).refine(
    (v) => v.startsWith("/") || v.startsWith("http://") || v.startsWith("https://"),
    { message: "URL must be absolute (http/https) or root-relative" }
  ),
  est_principale: z.boolean().optional(),
  texte_alternatif: z.string().max(255).optional().nullable(),
  ordre_affichage: z.number().int().optional().nullable(),
  type_image: z.enum(["bouteille", "tiquette", "verre", "domaine", "carte"]).optional().nullable(),
});

const champagneDetails = z.object({
  type_champagne: z.string().max(50).optional().nullable(),
  style_champagne: z.string().max(50).optional().nullable(),
  niveau_sucre: z.string().max(50).optional().nullable(),
  millesime: z.number().int().optional().nullable(),
  maison: z.string().max(100).optional().nullable(),
  m_thode__laboration: z.enum(["traditionnelle", "charmat", "ancestrale"]).optional().nullable(),
  temps_prise_mousse: z.string().max(50).optional().nullable(),
  caract_ristiques_bulle: z.enum(["fine", "persistante", "cr_meuse"]).optional().nullable(),
  conseils_service: z.string().max(2000).optional().nullable(),
}).partial();

const cognacDetails = z.object({
  cat_gorie__ge: z.string().max(50).optional().nullable(),
  r_gion_cognac: z.string().max(50).optional().nullable(),
  appellation: z.string().max(100).optional().nullable(),
  ge_minimum: z.number().int().optional().nullable(),
  m_thode__l_vage: z.string().max(50).optional().nullable(),
  caract_ristiques_aromatiques: z.string().max(2000).optional().nullable(),
  temp_rature_service: z.string().max(50).optional().nullable(),
}).partial();

const baseProductFields = {
  nom: z.string().min(1).max(255),
  type: z.enum(["vin", "champagne", "cognac"]),
  cat_gorie: z.string().max(100).optional().nullable(),
  region_id: optionalNumberOrEmptyString,
  domaine_id: optionalNumberOrEmptyString,
  classification_id: optionalNumberOrEmptyString,
  campagne_id: optionalNumberOrEmptyString,
  style: z.string().max(100).optional().nullable(),
  appellation: z.string().max(150).optional().nullable(),
  teneur_alcool: z.union([z.number(), z.string()]).optional().nullable(),
  temp_rature_service: z.string().max(50).optional().nullable(),
  taille_bouteille: z.string().max(20).optional().nullable(),
  prix: z.union([z.number(), z.string()]).optional().nullable(),
  cote: z.union([z.number(), z.string()]).optional().nullable(),
  millesime: z.union([z.number().int(), z.string()]).optional().nullable(),
  garder_jusqu_: z.union([z.number().int(), z.string()]).optional().nullable(),
  allerg_nes: z.string().max(2000).optional().nullable(),
  description: z.string().max(10000).optional().nullable(),
  caract_ristiques: z.string().max(10000).optional().nullable(),
  conseils_d_gustation: z.string().max(10000).optional().nullable(),
  ordre_affichage: z.number().int().optional().nullable(),
  disponible: z.boolean().optional(),
  quantit__stock: z.number().int().min(0).optional().nullable(),
  seuil_alerte: z.number().int().min(0).optional().nullable(),
  promotion: z.union([z.number(), z.string()]).optional().nullable(),
  date_promotion: z.string().optional().nullable(),
  bio: z.boolean().optional(),
  v_g_talien: z.boolean().optional(),
  champagne_details: champagneDetails.optional().nullable(),
  cognac_details: cognacDetails.optional().nullable(),
  produit_cepages: z.array(cepageItem).optional(),
  produit_accords: z.array(accordItem).optional(),
  produit_images: z.array(imageItem).optional(),
};

export const createProductSchema = z.object(baseProductFields).strict();
export const updateProductSchema = z.object(baseProductFields).partial().strict();

export const stockUpdateSchema = z.object({
  quantity: z.number().int(),
  type: z.enum(["entr_e", "sortie", "inventaire", "ajustement"]),
  reason: z.string().min(1).max(255),
});
