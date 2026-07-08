import { z } from "zod";

// Whitelist of editable campaign fields. Unknown keys are stripped (zod default),
// which blocks mass-assignment of columns the client should not control.
export const createCampaignSchema = z.object({
  nom: z.string().min(1).max(100),
  titre_affiche: z.string().max(255).optional(),
  sous_titre: z.string().max(255).optional(),
  description: z.string().optional(),
  image_url: z.string().optional(),
  couleur_fond: z.string().max(20).optional(),
  texte_bouton: z.string().max(50).optional(),
  lien_bouton: z.string().max(255).optional(),
  position: z.number().int().optional(),
  est_active: z.boolean().optional(),
  date_debut: z.coerce.date().nullable().optional(),
  date_fin: z.coerce.date().nullable().optional(),
  produits_ids: z.array(z.number().int().positive()).optional(),
});

export const updateCampaignSchema = createCampaignSchema.partial();
