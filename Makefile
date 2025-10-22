# Makefile pour Art Shop Application
# Utilisation: make [commande]

.PHONY: help install dev build test clean

# Affiche l'aide
help:
	@echo "Art Shop Application - Commandes disponibles:"
	@echo ""
	@echo "  make install     - Installe toutes les dépendances"
	@echo "  make dev         - Lance l'application en mode développement (Docker)"
	@echo "  make dev-local   - Lance l'application localement (sans Docker)"
	@echo "  make build       - Build tout le projet"
	@echo "  make test        - Lance tous les tests"
	@echo "  make lint        - Vérifie le code (ESLint)"
	@echo "  make format      - Formate le code (Prettier)"
	@echo "  make logs        - Affiche les logs Docker"
	@echo "  make down        - Arrête tous les conteneurs"
	@echo "  make clean       - Nettoie le projet (node_modules, dist)"
	@echo "  make db-shell    - Ouvre un shell PostgreSQL"
	@echo "  make db-seed     - Insère les données de test dans la base"
	@echo "  make db-reset    - Réinitialise la base de données"
	@echo "  make prod        - Lance en mode production"
	@echo ""

# Installation des dépendances
install:
	@echo "📦 Installation des dépendances..."
	npm install
	cd apps/web && npm install
	cd apps/api && npm install
	cd packages/shared && npm install
	@echo "✅ Installation terminée!"

# Développement avec Docker
dev:
	@echo "🚀 Lancement de l'application (Docker)..."
	docker-compose up

# Développement local
dev-local:
	@echo "🚀 Lancement de l'application (local)..."
	npm run dev:both

# Build complet
build:
	@echo "🔨 Build du projet..."
	npm run build

# Tests
test:
	@echo "🧪 Lancement des tests..."
	npm run test

# Linting
lint:
	@echo "🔍 Vérification du code..."
	npm run lint

# Formatage
format:
	@echo "✨ Formatage du code..."
	npm run format

# Logs Docker
logs:
	@echo "📋 Logs Docker..."
	docker-compose logs -f

# Arrêt des conteneurs
down:
	@echo "🛑 Arrêt des conteneurs..."
	docker-compose down

# Nettoyage
clean:
	@echo "🧹 Nettoyage du projet..."
	npm run clean
	@echo "✅ Nettoyage terminé!"

# Shell PostgreSQL
db-shell:
	@echo "🐘 Ouverture du shell PostgreSQL..."
	docker-compose exec db psql -U artshop_user -d artshop_db

# Seeding de la base de données
db-seed:
	@echo "📥 Insertion des données de test..."
	docker exec -i artshop-db psql -U artshop_user -d artshop_db < apps/api/database/seed-users.sql
	@echo "✅ Données insérées!"

# Réinitialisation complète de la base
db-reset:
	@echo "🔄 Réinitialisation de la base de données..."
	docker-compose down -v
	docker-compose up -d db
	@echo "⏳ Attente de PostgreSQL..."
	@sleep 10
	@echo "✅ Base de données réinitialisée (les seeds seront appliqués automatiquement)"

# Production
prod:
	@echo "🚢 Lancement en mode production..."
	docker-compose -f docker-compose.prod.yml up -d
