import { z } from "zod";

export const productQuerySchema = z.object({
  types: z.string().optional().transform(v => v?.split(",")),
  regions: z.string().optional().transform(v => v?.split(",").map(Number)),
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
  disponible: z.string().optional().default("true").transform(v => v === "true"),
  search: z.string().optional(),
  sortBy: z.enum(["prix_asc", "prix_desc", "note_desc", "nom_asc", "promotion_desc"]).optional().default("nom_asc"),
  page: z.string().optional().default("1").transform(v => parseInt(v)),
  limit: z.string().optional().default("12").transform(v => parseInt(v)),
});

export type ProductQuery = z.infer<typeof productQuerySchema>;
