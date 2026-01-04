export class ProductTransformer {
  static formatProducts(products: any[]) {
    return products.map((product) => this.formatProduct(product));
  }

  static formatProduct(product: any) {
    const notes = product.avis_clients?.map((avis: any) => avis.note) || [];
    const note_moyenne =
      notes.length > 0
        ? notes.reduce((a: number, b: number) => a + b, 0) / notes.length
        : 0;

    const imageUrl = product.produit_images?.[0]?.url || null;

    const cepages =
      product.produit_cepages?.map((pc: any) => ({
        nom: pc.cepages.nom,
        type: pc.cepages.type,
        pourcentage: pc.pourcentage,
        role: pc.r_le,
      })) || [];

    return {
      id: product.id,
      nom: product.nom,
      type: product.type,
      cat_gorie: product.cat_gorie,
      region: product.regions?.nom,
      domaine: product.domaines?.nom,
      appellation: product.appellation,
      teneur_alcool: product.teneur_alcool,
      taille_bouteille: product.taille_bouteille,
      style: product.style,
      prix: product.prix,
      promotion: product.promotion,
      cote: product.cote,
      millesime: product.millesime,
      description: product.description,
      caract_ristiques: product.caract_ristiques,
      bio: product.bio,
      v_g_talien: product.v_g_talien,
      quantit__stock: product.quantit__stock,
      images:
        product.produit_images?.map((img: any) => img.url) ||
        [imageUrl].filter(Boolean),
      note_moyenne: parseFloat(note_moyenne.toFixed(1)),
      nombre_avis: notes.length,
      cepages,
      classification: product.classifications?.nom,
      niveau_classification: product.classifications?.niveau,
      conseils_degustation: product.conseils_d_gustation,
      temperature_service: product.temp_rature_service,
    };
  }

  static formatProductWithDetails(product: any) {
    const averageRating =
      product.avis_clients.length > 0
        ? product.avis_clients.reduce(
            (acc: number, avis: any) => acc + avis.note,
            0
          ) / product.avis_clients.length
        : null;

    const favoritesCount = product.favoris.length;

    const formattedCepages = product.produit_cepages.map((pc: any) => ({
      id: pc.cepages.id,
      nom: pc.cepages.nom,
      type: pc.cepages.type,
      pourcentage: pc.pourcentage,
      ordre: pc.ordre_m_lange,
      role: pc.r_le,
    }));

    const formattedAccords = product.produit_accords.map((pa: any) => ({
      id: pa.accords_mets.id,
      nom: pa.accords_mets.nom,
      categorie: pa.accords_mets.cat_gorie,
      sousCategorie: pa.accords_mets.sous_cat_gorie,
      forceAccord: pa.force_accord,
      commentaire: pa.commentaire,
    }));

    const formattedImages = product.produit_images.map((img: any) => ({
      id: img.id,
      url: img.url,
      estPrincipale: img.est_principale,
      texteAlternatif: img.texte_alternatif,
      ordre: img.ordre_affichage,
      type: img.type_image,
    }));

    const formattedAvis = product.avis_clients.map((avis: any) => ({
      id: avis.id,
      note: avis.note,
      commentaire: avis.commentaire,
      avantages: avis.avantages,
      inconvenients: avis.inconv_nients,
      recommande: avis.recommand_,
      date: avis.cr___le,
      utilisateur: {
        nom: avis.utilisateurs.nom,
        prenom: avis.utilisateurs.pr_nom,
      },
    }));

    const baseProduct = {
      id: product.id,
      nom: product.nom,
      type: product.type,
      categorie: product.cat_gorie,
      region: product.regions,
      domaine: product.domaines,
      classification: product.classifications,
      style: product.style,
      appellation: product.appellation,
      teneurAlcool: product.teneur_alcool,
      temperatureService: product.temp_rature_service,
      tailleBouteille: product.taille_bouteille,
      prix: product.prix,
      cote: product.cote,
      millesime: product.millesime,
      garderJusqua: product.garder_jusqu_,
      allergenes: product.allerg_nes,
      description: product.description,
      caracteristiques: product.caract_ristiques,
      conseilsDegustation: product.conseils_d_gustation,
      ordreAffichage: product.ordre_affichage,
      disponible: product.disponible,
      quantiteStock: product.quantit__stock,
      seuilAlerte: product.seuil_alerte,
      promotion: product.promotion,
      datePromotion: product.date_promotion,
      bio: product.bio,
      vegetalien: product.v_g_talien,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      noteMoyenne: averageRating,
      nombreAvis: product.avis_clients.length,
      nombreFavoris: favoritesCount,
      cepages: formattedCepages,
      accords: formattedAccords,
      images: formattedImages,
      avis: formattedAvis,
      historiqueStocks: product.historique_stocks,
    };

    if (product.type === "champagne") {
      return {
        ...baseProduct,
        detailsChampagne: product.champagne_details
          ? {
              typeChampagne: product.champagne_details.type_champagne,
              styleChampagne: product.champagne_details.style_champagne,
              niveauSucre: product.champagne_details.niveau_sucre,
              millesime: product.champagne_details.millesime,
              maison: product.champagne_details.maison,
              methodeElaboration: product.champagne_details.m_thode__laboration,
              tempsPriseMousse: product.champagne_details.temps_prise_mousse,
              caracteristiquesBulle: product.champagne_details.caract_ristiques_bulle,
              conseilsService: product.champagne_details.conseils_service,
            }
          : null,
      };
    }

    if (product.type === "cognac") {
      return {
        ...baseProduct,
        detailsCognac: product.cognac_details
          ? {
              categorieAge: product.cognac_details.cat_gorie__ge,
              regionCognac: product.cognac_details.r_gion_cognac,
              appellation: product.cognac_details.appellation,
              ageMinimum: product.cognac_details.ge_minimum,
              methodeElevage: product.cognac_details.m_thode__l_vage,
              caracteristiquesAromatiques: product.cognac_details.caract_ristiques_aromatiques,
              temperatureService: product.cognac_details.temp_rature_service,
            }
          : null,
      };
    }

    return baseProduct;
  }
}
