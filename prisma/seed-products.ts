import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- Data Constants ---

const REGIONS = [
  { nom: 'Bordeaux', pays: 'France', climat: 'oc_anique', description: 'Célèbre pour ses vins rouges puissants et élégants.' },
  { nom: 'Bourgogne', pays: 'France', climat: 'continental', description: 'Terre de finesse, patrie du Pinot Noir et du Chardonnay.' },
  { nom: 'Champagne', pays: 'France', climat: 'continental', description: 'La région emblématique des vins effervescents.' },
  { nom: 'Cognac', pays: 'France', climat: 'oc_anique', description: 'Le berceau des eaux-de-vie de renommée mondiale.' },
  { nom: 'Vallée du Rhône', pays: 'France', climat: 'm_diterran_en', description: 'Des vins généreux et épicés.' },
  { nom: 'Alsace', pays: 'France', climat: 'continental', description: 'Réputée pour ses vins blancs aromatiques.' },
];

const DOMAINES_NAMES = [
  'Château Margaux', 'Domaine de la Romanée-Conti', 'Château Lafite Rothschild', 'Domaine Leflaive',
  'Maison Ruinart', 'Maison Hennessy', 'Château d\'Yquem', 'Domaine Guigal', 'Maison Bollinger', 'Château Petrus',
  'Domaine Leroy', 'Maison Martell', 'Château Cheval Blanc', 'Domaine Faiveley', 'Maison Krug'
];

const CEPAGES = [
  { nom: 'Merlot', type: 'rouge', description: 'Rond et fruité.' },
  { nom: 'Cabernet Sauvignon', type: 'rouge', description: 'Structure et garde.' },
  { nom: 'Pinot Noir', type: 'rouge', description: 'Finesse et élégance.' },
  { nom: 'Syrah', type: 'rouge', description: 'Épicé et puissant.' },
  { nom: 'Chardonnay', type: 'blanc', description: 'Riche et complexe.' },
  { nom: 'Sauvignon Blanc', type: 'blanc', description: 'Vif et aromatique.' },
  { nom: 'Riesling', type: 'blanc', description: 'Minéral et fruité.' },
  { nom: 'Ugni Blanc', type: 'blanc', description: 'Idéal pour le Cognac.' },
  { nom: 'Grenache', type: 'rouge', description: 'Généreux et chaleureux.' },
  { nom: 'Pinot Meunier', type: 'rouge', description: 'Fruité et souple (Champagne).' },
];

const ACCORDS = [
  { nom: 'Bœuf Bourguignon', categorie: 'viande', force: 'fort' },
  { nom: 'Saumon Grillé', categorie: 'poisson', force: 'moyen' },
  { nom: 'Foie Gras', categorie: 'volaille', force: 'fort' },
  { nom: 'Plateau de Fromages', categorie: 'fromage', force: 'moyen' },
  { nom: 'Tarte au Citron', categorie: 'dessert', force: 'l_ger' },
  { nom: 'Huîtres', categorie: 'crustac_s', force: 'l_ger' },
  { nom: 'Agneau Rôti', categorie: 'viande', force: 'fort' },
  { nom: 'Chocolat Noir', categorie: 'dessert', force: 'fort' },
  { nom: 'Apéritif Dinatoire', categorie: 'ap_ritif', force: 'moyen' },
  { nom: 'Pâtes aux Truffes', categorie: 'p_tes', force: 'moyen' },
];

const CLASSIFICATIONS = [
  { nom: 'Grand Cru', niveau: 'Grand_Cru' },
  { nom: 'Premier Cru', niveau: 'Premier_Cru' },
  { nom: 'AOC', niveau: 'Autre' },
  { nom: 'Cru Classé', niveau: 'Cru_Class_' },
  { nom: 'XO (Extra Old)', niveau: 'Autre' }, // For Cognac context mainly
];

const UNSPLASH_IDS = {
  rouge: ['1506377247377-2a5b3b417ebb', '1559563362-c667ba5f54b7', '1584916201218-f4242ceb4809', '1510812431409-9290b6554324'],
  blanc: ['1585553616435-2dc0a54e271d', '1572569878853-20517ee92526', '1589308226068-07c4c3e80931'],
  champagne: ['1598155523122-3842334d6c10', '1594453470724-42b784964648', '1558346490-a72e53ae2d4f'],
  cognac: ['1613243555988-441166d4d6fd', '1528823872056-607117af0994', '1569923485-645c36394f71']
};

// --- Helper Functions ---

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomSubarray<T>(array: T[], n: number): T[] {
  const shuffled = array.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomPrice(): number {
  return getRandomInt(15000, 150000); // Prices in XOF roughly
}

// --- Main Seed Function ---

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Clean Database
  console.log('🧹 Cleaning database...');
  await prisma.avis_clients.deleteMany();
  await prisma.favoris.deleteMany();
  await prisma.produit_images.deleteMany();
  await prisma.produit_cepages.deleteMany();
  await prisma.produit_accords.deleteMany();
  await prisma.historique_stocks.deleteMany();
  await prisma.champagne_details.deleteMany();
  await prisma.cognac_details.deleteMany();
  await prisma.produits.deleteMany();
  await prisma.domaines.deleteMany();
  await prisma.classifications.deleteMany();
  await prisma.regions.deleteMany();
  await prisma.cepages.deleteMany();
  await prisma.accords_mets.deleteMany();

  // 2. Insert Reference Data
  console.log('🏗️ Creating reference data...');

  // Regions
  const regionsMap = new Map();
  for (const r of REGIONS) {
    const region = await prisma.regions.create({
      data: { nom: r.nom, pays: r.pays, climat: r.climat as any, description: r.description }
    });
    regionsMap.set(r.nom, region.id);
  }

  // Domaines
  const domainesIds = [];
  for (const dName of DOMAINES_NAMES) {
    // Assign random region
    const regionName = getRandomItem(REGIONS).nom;
    const domaine = await prisma.domaines.create({
      data: {
        nom: dName,
        region_id: regionsMap.get(regionName),
        description: `Un domaine prestigieux situé en ${regionName}.`,
        propri_taire: 'Famille ' + dName.split(' ')[1] || 'Propriétaire',
        ann_e_fondation: getRandomInt(1901, 2000)
      }
    });
    domainesIds.push(domaine.id);
  }

  // Cepages
  const cepagesMap = new Map();
  for (const c of CEPAGES) {
    const cepage = await prisma.cepages.create({
      data: { nom: c.nom, type: c.type as any, caract_ristiques: c.description }
    });
    cepagesMap.set(c.nom, cepage);
  }

  // Accords
  const accordsIds = [];
  for (const a of ACCORDS) {
    const accord = await prisma.accords_mets.create({
      data: { nom: a.nom, cat_gorie: a.categorie as any, force_accord: a.force as any }
    });
    accordsIds.push(accord.id);
  }

  // Classifications
  const classificationsIds = [];
  for (const c of CLASSIFICATIONS) {
    const classification = await prisma.classifications.create({
      data: { nom: c.nom, niveau: c.niveau as any }
    });
    classificationsIds.push(classification.id);
  }

  // 3. Generate 100 Products
  console.log('🍷 Generating 100 products...');

  const productTypes = ['vin', 'vin', 'vin', 'champagne', 'cognac']; // Weight towards wine

  for (let i = 0; i < 100; i++) {
    const type = getRandomItem(productTypes);
    let nom = '';
    let style = '';
    let regionName = '';
    let cepageList: any[] = [];
    let imageCategory = 'rouge';

    // Configure Product based on Type
    if (type === 'vin') {
      const color = getRandomItem(['rouge', 'blanc', 'ros_']);
      style = `vin_${color === 'ros_' ? 'rose' : color}`;
      imageCategory = color === 'ros_' ? 'rouge' : color; // Use red images for rose for now or mix
      
      if (color === 'rouge') {
        regionName = getRandomItem(['Bordeaux', 'Bourgogne', 'Vallée du Rhône']);
        cepageList = [cepagesMap.get('Merlot'), cepagesMap.get('Cabernet Sauvignon'), cepagesMap.get('Pinot Noir'), cepagesMap.get('Syrah')].filter(Boolean);
        nom = `${getRandomItem(['Château', 'Domaine'])} ${getRandomItem(['Grand', 'Petit', 'Vieux'])} ${getRandomItem(['Chêne', 'Roc', 'Val', 'Mont'])}`;
      } else {
        regionName = getRandomItem(['Alsace', 'Bourgogne', 'Vallée du Rhône']);
        cepageList = [cepagesMap.get('Chardonnay'), cepagesMap.get('Sauvignon Blanc'), cepagesMap.get('Riesling')].filter(Boolean);
        nom = `${getRandomItem(['Clos', 'Domaine'])} des ${getRandomItem(['Fleurs', 'Sources', 'Pierres'])}`;
      }
    } else if (type === 'champagne') {
      regionName = 'Champagne';
      style = 'brut'; // simplified
      imageCategory = 'champagne';
      cepageList = [cepagesMap.get('Chardonnay'), cepagesMap.get('Pinot Noir'), cepagesMap.get('Pinot Meunier')].filter(Boolean);
      nom = `Champagne ${getRandomItem(['Royal', 'Impérial', 'Cuvée', 'Réserve'])} ${getRandomItem(['Prestige', 'Or', 'Diamant'])}`;
    } else if (type === 'cognac') {
      regionName = 'Cognac';
      style = 'xo'; // simplified
      imageCategory = 'cognac';
      cepageList = [cepagesMap.get('Ugni Blanc')].filter(Boolean);
      nom = `Cognac ${getRandomItem(['Héritage', 'Tradition', 'Ancestral'])} ${getRandomItem(['Noir', 'Ambré'])}`;
    }

    // Create Product
    const product = await prisma.produits.create({
      data: {
        nom: `${nom} ${getRandomInt(1, 100)}`,
        type: type as any,
        cat_gorie: type === 'vin' ? style.replace('vin_', '') : type,
        style: style,
        region_id: regionsMap.get(regionName) || regionsMap.get('Bordeaux'),
        domaine_id: getRandomItem(domainesIds),
        classification_id: getRandomItem(classificationsIds),
        appellation: `${regionName} Contrôlée`,
        teneur_alcool: getRandomInt(11, 15) + (Math.random() > 0.5 ? 0.5 : 0),
        temp_rature_service: '16-18°C',
        taille_bouteille: '75cl',
        prix: getRandomPrice(),
        cote: getRandomInt(14, 20),
        millesime: getRandomInt(2010, 2023),
        garder_jusqu_: getRandomInt(2028, 2040),
        description: `Un ${type} d'exception provenant de ${regionName}. Il offre une robe magnifique et des arômes complexes.`,
        caract_ristiques: 'Robe intense, nez fruité, bouche ample.',
        conseils_d_gustation: 'A déguster avec des amis ou pour une grande occasion.',
        quantit__stock: getRandomInt(0, 50),
        disponible: true,
        bio: Math.random() > 0.8,
        promotion: Math.random() > 0.8 ? getRandomInt(5, 20) : 0,
      }
    });

    // Add Image
    const imgId = getRandomItem(UNSPLASH_IDS[imageCategory as keyof typeof UNSPLASH_IDS]);
    await prisma.produit_images.create({
      data: {
        produit_id: product.id,
        url: `https://images.unsplash.com/photo-${imgId}?auto=format&fit=crop&w=800&q=80`,
        est_principale: true,
        type_image: 'bouteille'
      }
    });

    // Add Cepages (1 to 3)
    const selectedCepages = getRandomSubarray(cepageList, getRandomInt(1, Math.min(3, cepageList.length)));
    let remainingPercent = 100;
    for (let j = 0; j < selectedCepages.length; j++) {
      const cepage = selectedCepages[j];
      const percent = j === selectedCepages.length - 1 ? remainingPercent : Math.floor(remainingPercent / 2);
      remainingPercent -= percent;
      
      await prisma.produit_cepages.create({
        data: {
          produit_id: product.id,
          cepage_id: cepage.id,
          pourcentage: percent,
          r_le: j === 0 ? 'principal' : 'assemblage'
        }
      });
    }

    // Add Accords (1 to 3)
    const selectedAccords = getRandomSubarray(accordsIds, getRandomInt(1, 3));
    for (const accordId of selectedAccords) {
      await prisma.produit_accords.create({
        data: {
          produit_id: product.id,
          accord_id: accordId,
          force_accord: getRandomItem(['excellent', 'bon', 'correct']) as any
        }
      });
    }

    // Add Specific Details
    if (type === 'champagne') {
      await prisma.champagne_details.create({
        data: {
          produit_id: product.id,
          type_champagne: getRandomItem(['Brut', 'Extra_Brut', 'Demi_Sec']) as any,
          style_champagne: getRandomItem(['Blanc_de_Blancs', 'Ros_', 'Mill_sim_']) as any,
          niveau_sucre: '6-12 g/L',
          millesime: product.millesime,
          maison: 'Maison ' + nom.split(' ')[1],
          caract_ristiques_bulle: 'fine'
        }
      });
    } else if (type === 'cognac') {
      await prisma.cognac_details.create({
        data: {
          produit_id: product.id,
          cat_gorie__ge: getRandomItem(['VS', 'VSOP', 'XO']) as any,
          r_gion_cognac: getRandomItem(['Grande_Champagne', 'Petite_Champagne', 'Fins_Bois']) as any,
          ge_minimum: getRandomInt(2, 10),
          m_thode__l_vage: 'f_ts_neufs'
        }
      });
    }
  }

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
