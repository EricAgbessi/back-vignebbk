import { z } from "zod";

const contenuItemSchema = z.object({
  produit_id: z.number().int().positive(),
  quantite: z.number().int().positive().optional(),
});

// Whitelist of editable caisse fields. Unknown keys are stripped (zod default),
// which blocks mass-assignment of columns the client should not control.
export const createCaisseSchema = z.object({
  nom: z.string().min(1).max(255),
  description: z.string().optional(),
  prix: z.number().nonnegative(),
  promotion: z.number().min(0).max(100).nullable().optional(),
  image_url: z.string().optional(),
  quantite_stock: z.number().int().min(0).optional(),
  est_active: z.boolean().optional(),
  campagne_id: z.number().int().positive().nullable().optional(),
  contenu: z.array(contenuItemSchema).optional(),
});

export const updateCaisseSchema = createCaisseSchema.partial();
