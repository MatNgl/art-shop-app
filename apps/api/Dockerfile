# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Build l'application NestJS
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copier package.json et installer seulement les dépendances de production
COPY package*.json ./
RUN npm ci --only=production

# Copier les fichiers buildés depuis le stage précédent
COPY --from=build /app/dist ./dist

# Exposer le port 3000
EXPOSE 3000

# Variable d'environnement par défaut
ENV NODE_ENV=production

# Démarrer l'application
CMD ["node", "dist/main"]
