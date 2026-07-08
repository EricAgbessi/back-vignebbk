import { prisma } from "../utils";

export class ReferentialsService {
  // Regions
  async getRegions() {
    return prisma.regions.findMany({ orderBy: { nom: "asc" } });
  }

  async createRegion(data: any) {
    return prisma.regions.create({ data });
  }

  async updateRegion(id: number, data: any) {
    return prisma.regions.update({ where: { id }, data });
  }

  async deleteRegion(id: number) {
    return prisma.regions.delete({ where: { id } });
  }

  // Domaines
  async getDomaines() {
    return prisma.domaines.findMany({ 
      include: { regions: true },
      orderBy: { nom: "asc" } 
    });
  }

  async createDomaine(data: any) {
    return prisma.domaines.create({ data });
  }

  async updateDomaine(id: number, data: any) {
    return prisma.domaines.update({ where: { id }, data });
  }

  async deleteDomaine(id: number) {
    return prisma.domaines.delete({ where: { id } });
  }

  // Cepages
  async getCepages() {
    return prisma.cepages.findMany({ orderBy: { nom: "asc" } });
  }

  async createCepage(data: any) {
    const { description, ...rest } = data;
    const createData = {
      ...rest,
      caract_ristiques: description || rest.caract_ristiques
    };
    return prisma.cepages.create({ data: createData });
  }

  async updateCepage(id: number, data: any) {
    const { description, ...rest } = data;
    const updateData = {
      ...rest,
      caract_ristiques: description !== undefined ? description : rest.caract_ristiques
    };
    return prisma.cepages.update({ where: { id }, data: updateData });
  }

  async deleteCepage(id: number) {
    return prisma.cepages.delete({ where: { id } });
  }

  // Classifications
  async getClassifications() {
    return prisma.classifications.findMany({ 
      include: { regions: true },
      orderBy: { nom: "asc" } 
    });
  }

  async createClassification(data: any) {
    return prisma.classifications.create({ data });
  }

  async updateClassification(id: number, data: any) {
    return prisma.classifications.update({ where: { id }, data });
  }

  async deleteClassification(id: number) {
    return prisma.classifications.delete({ where: { id } });
  }

  // Accords Mets
  async getAccordsMets() {
    return prisma.accords_mets.findMany({ orderBy: { nom: "asc" } });
  }

  async createAccord(data: any) {
    return prisma.accords_mets.create({ data });
  }

  async updateAccord(id: number, data: any) {
    return prisma.accords_mets.update({ where: { id }, data });
  }

  async deleteAccord(id: number) {
    return prisma.accords_mets.delete({ where: { id } });
  }
}
