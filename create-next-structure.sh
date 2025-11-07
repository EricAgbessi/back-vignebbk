#!/bin/bash

# Script pour créer l'arborescence Next.js
# Sauvegardez sous create-structure.sh puis: chmod +x create-structure.sh

echo "🏗️  Création de l'arborescence Next.js..."

# Base directory (modifiable)
BASE_DIR="app"

# Créer la structure principale
mkdir -p $BASE_DIR/vins/blancs/[slug]
mkdir -p $BASE_DIR/vins/region/[slug]
mkdir -p $BASE_DIR/vins/cepage/[slug]

mkdir -p $BASE_DIR/grands-vins/classification/[slug]
mkdir -p $BASE_DIR/grands-vins/millesime/[slug]

mkdir -p $BASE_DIR/champagnes/type/[slug]
mkdir -p $BASE_DIR/champagnes/style/[slug]

# Créer les fichiers page.tsx de base pour chaque route
create_page_file() {
    local dir=$1
    local name=$2
    cat > "$dir/page.tsx" << EOF
export default function ${name}() {
  return (
    <div>
      <h1>${name}</h1>
      <p>Page en construction</p>
    </div>
  );
}
EOF
}

# Créer les pages pour chaque niveau
create_page_file "$BASE_DIR/vins/blancs/[slug]" "VinBlancDetail"
create_page_file "$BASE_DIR/vins/region/[slug]" "RegionDetail"
create_page_file "$BASE_DIR/vins/cepage/[slug]" "CepageDetail"

create_page_file "$BASE_DIR/grands-vins/classification/[slug]" "ClassificationDetail"
create_page_file "$BASE_DIR/grands-vins/millesime/[slug]" "MillesimeDetail"

create_page_file "$BASE_DIR/champagnes/type/[slug]" "ChampagneTypeDetail"
create_page_file "$BASE_DIR/champagnes/style/[slug]" "ChampagneStyleDetail"

# Créer aussi les pages de listing
create_page_file "$BASE_DIR/vins" "VinsListing"
create_page_file "$BASE_DIR/grands-vins" "GrandsVinsListing"
create_page_file "$BASE_DIR/champagnes" "ChampagnesListing"

echo "✅ Arborescence créée avec succès!"
echo "📁 Structure créée:"
find $BASE_DIR -type d | sort