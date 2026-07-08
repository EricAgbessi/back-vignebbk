import { prisma } from "../utils";

export class CaissesService {
  async createCaisse(data: any) {
    const { contenu, ...caisseData } = data;

    return await prisma.$transaction(async (tx) => {
      const caisse = await tx.caisses.create({
        data: {
          ...caisseData,
        },
      });

      if (contenu && contenu.length > 0) {
        await tx.contenu_caisse.createMany({
          data: contenu.map((item: any) => ({
            caisse_id: caisse.id,
            produit_id: item.produit_id,
            quantite: item.quantite || 1,
          })),
        });
      }

      return caisse;
    });
  }

  async updateCaisse(id: number, data: any) {
    const { contenu, ...caisseData } = data;

    return await prisma.$transaction(async (tx) => {
      const caisse = await tx.caisses.update({
        where: { id },
        data: {
          ...caisseData,
        },
      });

      if (contenu) {
        // Delete existing content
        await tx.contenu_caisse.deleteMany({
          where: { caisse_id: id },
        });

        // Add new content
        if (contenu.length > 0) {
          await tx.contenu_caisse.createMany({
            data: contenu.map((item: any) => ({
              caisse_id: caisse.id,
              produit_id: item.produit_id,
              quantite: item.quantite || 1,
            })),
          });
        }
      }

      return caisse;
    });
  }

  async deleteCaisse(id: number) {
    return await prisma.caisses.delete({
      where: { id },
    });
  }

  async getCaisseById(id: number) {
    return await prisma.caisses.findUnique({
      where: { id },
      include: {
        contenu_caisse: {
          include: {
            produits: true,
          },
        },
      },
    });
  }
}
