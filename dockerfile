# ==================================
# ÉTAPE 1: ÉTAPE DE BUILD (CONSTRUCTION)
# ==================================
FROM node:22-alpine AS builder

# Installer les dépendances nécessaires au build (TypeScript, Prisma, etc.)
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm install

# Copier le code source de l'API
COPY . .

# Générer le client Prisma (crucial pour le backend)
RUN npx prisma generate

# Lancer la compilation TypeScript (npm run build -> tsc)
RUN npm run build

# ==================================
# ÉTAPE 2: ÉTAPE D'EXÉCUTION (RUN)
# ==================================
FROM node:22-alpine AS runner

ENV NODE_ENV=production
ENV PORT=8080 
# Le backend écoutera sur le port 8080 par défaut

WORKDIR /usr/src/app

# Copier uniquement les fichiers nécessaires à l'exécution :
# 1. Les dépendances de production uniquement
COPY --from=builder /usr/src/app/node_modules ./node_modules
# 2. Le code compilé (dist)
COPY --from=builder /usr/src/app/dist ./dist
# 3. Le fichier de démarrage (index.js dans dist)
COPY --from=builder /usr/src/app/package.json ./package.json

# Exposer le port de l'API
EXPOSE 8080

# Commande pour démarrer l'API compilée
CMD [ "npm", "start" ]