import { prisma } from "../utils";

export class CampaignsService {
  async getAllCampaigns() {
    return await prisma.campagnes.findMany({
      orderBy: {
        position: "asc",
      },
      include: {
        _count: {
          select: { produits: true },
        },
      },
    });
  }

  async getActiveCampaigns() {
    const now = new Date();
    return await prisma.campagnes.findMany({
      where: {
        est_active: true,
        OR: [
          { date_debut: null },
          { date_debut: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { date_fin: null },
              { date_fin: { gte: now } },
            ],
          },
        ],
      },
      orderBy: {
        position: "asc",
      },
      include: {
        produits: {
          where: {
            disponible: true,
          },
          take: 4, // Preview of products
        },
        caisses: {
          where: { est_active: true },
          include: {
            contenu_caisse: {
              include: {
                produits: true
              }
            }
          }
        }
      },
    });
  }

  async getCampaignById(id: number) {
    return await prisma.campagnes.findUnique({
      where: { id },
      include: {
        produits: true,
        caisses: {
          include: {
            contenu_caisse: {
              include: {
                produits: true
              }
            }
          }
        }
      },
    });
  }

  async createCampaign(data: any) {
    const { produits_ids, ...campaignData } = data;
    
    const campaign = await prisma.campagnes.create({
      data: {
        ...campaignData,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    if (produits_ids && produits_ids.length > 0) {
      await prisma.produits.updateMany({
        where: {
          id: { in: produits_ids },
        },
        data: {
          campagne_id: campaign.id,
        },
      });
    }

    return campaign;
  }

  async updateCampaign(id: number, data: any) {
    const { produits_ids, ...campaignData } = data;

    const campaign = await prisma.campagnes.update({
      where: { id },
      data: {
        ...campaignData,
        updated_at: new Date(),
      },
    });

    if (produits_ids) {
      // First, remove products from this campaign if they are not in the new list
      // Actually, simpler approach: 
      // 1. Unlink all products from this campaign
      // 2. Link new products
      
      // But maybe we want to keep existing ones if not specified? 
      // Let's assume produits_ids is the complete list of products for this campaign.
      
      await prisma.produits.updateMany({
        where: {
          campagne_id: id,
        },
        data: {
          campagne_id: null,
        },
      });

      if (produits_ids.length > 0) {
        await prisma.produits.updateMany({
          where: {
            id: { in: produits_ids },
          },
          data: {
            campagne_id: id,
          },
        });
      }
    }

    return campaign;
  }

  async deleteCampaign(id: number) {
    // Unlink products first
    await prisma.produits.updateMany({
      where: {
        campagne_id: id,
      },
      data: {
        campagne_id: null,
      },
    });

    return await prisma.campagnes.delete({
      where: { id },
    });
  }
}
