# 🎨 Art Shop Application

> Application e-commerce fullstack pour la vente d'œuvres d'art - Monorepo Angular + NestJS

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Angular](https://img.shields.io/badge/Angular-20-red)](https://angular.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-10-ea2845)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)](https://www.docker.com/)

---

## 📋 Table des matières

- [Architecture](#-architecture)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Démarrage rapide](#-démarrage-rapide-docker)
- [Développement](#-développement)
- [Scripts disponibles](#-scripts-disponibles)
- [Structure du projet](#-structure-du-projet)
- [Technologies](#-technologies)
- [Documentation](#-documentation)

---

## 🏗 Architecture

Ce projet est un **monorepo** structuré comme suit :

```
art-shop-app/
├── apps/
│   ├── web/              # Frontend Angular 20+ (client)
│   └── api/              # Backend NestJS (API REST)
├── packages/
│   └── shared/           # Types TypeScript partagés
├── docker-compose.yml    # Orchestration dev (Docker)
├── docker-compose.prod.yml # Orchestration production
└── package.json          # Scripts racine
```

### Stack technique

- **Frontend** : Angular 20+ (Standalone Components, Signals)
- **Backend** : NestJS 10 (Node.js, TypeScript)
- **Base de données** : PostgreSQL 16
- **Cache** : Redis 7
- **Conteneurisation** : Docker + Docker Compose
- **Styling** : Tailwind CSS
- **State Management** : Signals (Angular)

---

## 🔧 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** ≥ 20.0.0 ([Télécharger](https://nodejs.org/))
- **npm** ≥ 10.0.0 (inclus avec Node.js)
- **Docker Desktop** ([Télécharger](https://www.docker.com/products/docker-desktop/))
- **Git** ([Télécharger](https://git-scm.com/))

Vérifiez vos versions :

```bash
node --version  # v20.x.x ou supérieur
npm --version   # 10.x.x ou supérieur
docker --version
docker-compose --version
```

---

## 📦 Installation

### 1. Cloner le repository

```bash
git clone https://github.com/votre-username/art-shop-app.git
cd art-shop-app
```

### 2. Installer les dépendances

**Tout installer en une commande** :

```bash
npm run install:all
```

**Ou installer séparément** :

```bash
# Installer les dépendances racine (concurrently, prettier)
npm install

# Installer les dépendances du frontend
cd apps/web && npm install

# Installer les dépendances du backend
cd apps/api && npm install

# Installer les dépendances du package shared
cd packages/shared && npm install
```

### 3. Configurer les variables d'environnement

Le fichier `.env` est déjà créé dans `apps/api/.env` avec des valeurs par défaut pour le développement.

Pour la production, créez `apps/api/.env.production` avec vos propres valeurs sécurisées.

---

## 🚀 Démarrage rapide (Docker)

### Lancer toute l'application avec Docker Compose

**Mode développement** (hot reload activé) :

```bash
npm run dev
```

Cette commande lance :
- ✅ Frontend Angular sur [http://localhost:4200](http://localhost:4200)
- ✅ Backend NestJS sur [http://localhost:3000](http://localhost:3000)
- ✅ PostgreSQL sur `localhost:5432`
- ✅ Redis sur `localhost:6379`
- ✅ Adminer (interface DB) sur [http://localhost:8080](http://localhost:8080)

**Voir les logs en temps réel** :

```bash
npm run docker:logs
# ou pour un service spécifique
npm run docker:logs:web
npm run docker:logs:api
```

**Arrêter tous les conteneurs** :

```bash
npm run docker:down
```

---

## 💻 Développement

### Option 1 : Développement avec Docker (RECOMMANDÉ)

```bash
# Lancer tous les services
npm run dev

# Ou en mode détaché (arrière-plan)
npm run dev:detached

# Rebuild les images si modifications des Dockerfiles
npm run dev:build
```

### Option 2 : Développement local (sans Docker)

**Terminal 1 - Frontend** :

```bash
npm run dev:web
# Angular démarre sur http://localhost:4200
```

**Terminal 2 - Backend** :

```bash
npm run dev:api
# NestJS démarre sur http://localhost:3000
```

**Terminal 3 - Base de données** :

```bash
docker-compose up db redis
# Ou installez PostgreSQL et Redis localement
```

---

## 📜 Scripts disponibles

### Scripts racine (à exécuter depuis la racine)

| Commande | Description |
|----------|-------------|
| `npm run install:all` | Installe toutes les dépendances (web + api + shared) |
| `npm run dev` | Lance toute l'app avec Docker Compose |
| `npm run dev:web` | Lance le frontend Angular uniquement |
| `npm run dev:api` | Lance le backend NestJS uniquement |
| `npm run dev:both` | Lance web + api en parallèle (sans Docker) |
| `npm run build` | Build tout le projet (web + api + shared) |
| `npm run test` | Lance tous les tests |
| `npm run lint` | Vérifie le code (ESLint) |
| `npm run format` | Formate le code (Prettier) |

### Scripts Docker

| Commande | Description |
|----------|-------------|
| `npm run docker:up` | Lance tous les conteneurs |
| `npm run docker:down` | Arrête tous les conteneurs |
| `npm run docker:logs` | Affiche les logs de tous les services |
| `npm run docker:rebuild` | Rebuild et relance les conteneurs |
| `npm run docker:clean` | Nettoie volumes et images Docker |
| `npm run docker:prod` | Lance en mode production |

### Scripts Base de données

| Commande | Description |
|----------|-------------|
| `npm run db:shell` | Ouvre un shell PostgreSQL |
| `npm run db:backup` | Sauvegarde la DB dans `backup.sql` |
| `npm run db:restore` | Restaure la DB depuis `backup.sql` |
| `npm run redis:cli` | Ouvre Redis CLI |

---

## 📂 Structure du projet

```
art-shop-app/
├── apps/
│   ├── web/                          # Frontend Angular
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── core/             # Guards, interceptors
│   │   │   │   ├── shared/           # Composants/services réutilisables
│   │   │   │   ├── features/         # Modules métier
│   │   │   │   │   ├── auth/         # Authentification
│   │   │   │   │   ├── catalog/      # Catalogue produits
│   │   │   │   │   ├── cart/         # Panier et commande
│   │   │   │   │   ├── admin/        # Dashboard admin
│   │   │   │   │   ├── profile/      # Profil utilisateur
│   │   │   │   │   ├── favorites/    # Favoris
│   │   │   │   │   ├── promotions/   # Promotions
│   │   │   │   │   ├── fidelity/     # Fidélité
│   │   │   │   │   ├── subscriptions/ # Abonnements
│   │   │   │   │   ├── notifications/ # Notifications
│   │   │   │   │   ├── messaging/    # Messagerie
│   │   │   │   │   ├── legal/        # Pages légales
│   │   │   │   │   ├── contact/      # Contact
│   │   │   │   │   └── help/         # Aide
│   │   │   │   └── app.routes.ts    # Routing principal
│   │   ├── Dockerfile                # Production build
│   │   ├── Dockerfile.dev            # Dev build (hot reload)
│   │   └── nginx.conf                # Config nginx
│   │
│   └── api/                          # Backend NestJS
│       ├── src/
│       │   ├── main.ts               # Point d'entrée
│       │   ├── app.module.ts         # Module racine
│       │   ├── auth/                 # Module authentification
│       │   ├── users/                # Module utilisateurs
│       │   ├── products/             # Module produits
│       │   ├── orders/               # Module commandes
│       │   └── ...                   # Autres modules
│       ├── database/
│       │   └── init.sql              # Script init PostgreSQL
│       ├── Dockerfile                # Production build
│       ├── Dockerfile.dev            # Dev build (hot reload)
│       ├── .env.example              # Variables d'environnement
│       └── .env                      # Config dev (créé auto)
│
├── packages/
│   └── shared/                       # Types TypeScript partagés
│       ├── src/
│       │   └── index.ts              # Interfaces communes
│       ├── package.json
│       └── tsconfig.json
│
├── docker-compose.yml                # Dev orchestration
├── docker-compose.prod.yml           # Prod orchestration
├── package.json                      # Scripts racine
├── .gitignore
├── README.md                         # Ce fichier
└── DOCUMENTATION_FRONTEND.md         # Doc technique frontend
```

---

## 🛠 Technologies

### Frontend

- **Angular 20+** : Framework frontend
- **TypeScript 5+** : Langage
- **Tailwind CSS** : Styling
- **Signals** : State management réactif
- **RxJS** : Programmation réactive
- **@ng-select** : Composants select avancés
- **Font Awesome** : Icônes

### Backend

- **NestJS 10** : Framework Node.js
- **TypeScript** : Langage
- **PostgreSQL** : Base de données relationnelle
- **TypeORM / Prisma** : ORM (à configurer)
- **Redis** : Cache et sessions
- **Passport** : Authentification
- **bcrypt** : Hash des mots de passe
- **JWT** : Tokens d'authentification

### DevOps

- **Docker** : Conteneurisation
- **Docker Compose** : Orchestration multi-conteneurs
- **Nginx** : Serveur web (production frontend)
- **Adminer** : Interface web pour PostgreSQL

---

## 📖 Documentation

- **[Documentation Frontend complète](./DOCUMENTATION_FRONTEND.md)** : Architecture détaillée, modules, formulaires, state management, etc.
- **API Documentation** : Swagger disponible sur [http://localhost:3000/api](http://localhost:3000/api) (après démarrage)

---

## 🎯 Fonctionnalités principales

### Côté utilisateur

- ✅ Catalogue de produits avec filtres avancés
- ✅ Recherche, tri, pagination
- ✅ Panier avec gestion quantités
- ✅ Checkout avec adresses et paiements sauvegardés
- ✅ Promotions automatiques
- ✅ Programme de fidélité avec récompenses
- ✅ Abonnements mensuels (3 plans)
- ✅ Favoris
- ✅ Historique commandes
- ✅ Pages légales (CGV, RGPD, FAQ)

### Côté admin

- ✅ Dashboard avec statistiques
- ✅ CRUD produits, catégories, formats
- ✅ Gestion commandes et statuts
- ✅ Gestion utilisateurs
- ✅ Création/gestion promotions
- ✅ Gestion abonnements et box mensuelles
- ✅ Système de notifications
- ✅ Messagerie entre admins

---

## 🔐 Authentification

**Compte admin de test** :
- Email : `admin@artshop.com`
- Password : `admin123` (hash stocké en DB)

**Compte utilisateur de test** :
- Email : `user@artshop.com`
- Password : `user123`

> ⚠️ **Production** : Changez absolument ces mots de passe et la variable `JWT_SECRET` !

---

## 🌐 URLs de développement

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | [http://localhost:4200](http://localhost:4200) | Application Angular |
| Backend API | [http://localhost:3000](http://localhost:3000) | API NestJS |
| Swagger Docs | [http://localhost:3000/api](http://localhost:3000/api) | Documentation API |
| Adminer (DB) | [http://localhost:8080](http://localhost:8080) | Interface PostgreSQL |

**Connexion Adminer** :
- Système : PostgreSQL
- Serveur : `db`
- Utilisateur : `artshop_user`
- Mot de passe : `artshop_password`
- Base : `artshop_db`

---

## 🚢 Déploiement

### Production avec Docker

```bash
# Build et lancer en mode production
npm run docker:prod:build

# Ou sans rebuild
npm run docker:prod
```

### Déploiement sur un serveur

1. Configurez `apps/api/.env.production` avec vos vraies variables
2. Buildez les images : `docker-compose -f docker-compose.prod.yml build`
3. Lancez : `docker-compose -f docker-compose.prod.yml up -d`

### Déploiement cloud

- **Frontend** : Vercel, Netlify, AWS S3 + CloudFront
- **Backend** : Railway, Render, AWS ECS, Google Cloud Run
- **Database** : Supabase, AWS RDS, Google Cloud SQL

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez suivre ces étapes :

1. Fork le projet
2. Créez une branche : `git checkout -b feature/ma-feature`
3. Committez : `git commit -m "feat: ajout ma feature"`
4. Pushez : `git push origin feature/ma-feature`
5. Ouvrez une Pull Request

---

## 📝 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 👨‍💻 Auteur

**Matthéo** - M2 EFREI

- GitHub : [@votre-username](https://github.com/votre-username)
- Email : votre.email@exemple.com

---

## 🙏 Remerciements

- [Angular](https://angular.dev/)
- [NestJS](https://nestjs.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [Docker](https://www.docker.com/)

---

**Bon développement ! 🚀**
