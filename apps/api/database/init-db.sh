#!/bin/bash
set -e

echo "🔄 Initialisation de la base de données..."

# Attendre que PostgreSQL soit prêt
until pg_isready -U artshop_user -d artshop_db; do
  echo "⏳ En attente de PostgreSQL..."
  sleep 2
done

echo "✅ PostgreSQL est prêt"

# Vérifier si les utilisateurs existent déjà
USER_COUNT=$(psql -U artshop_user -d artshop_db -tAc "SELECT COUNT(*) FROM users WHERE email IN ('admin@example.com', 'user@example.com')")

if [ "$USER_COUNT" -eq "0" ]; then
  echo "📥 Insertion des utilisateurs de test..."
  psql -U artshop_user -d artshop_db -f /docker-entrypoint-initdb.d/seed-users.sql
  echo "✅ Utilisateurs de test créés"
else
  echo "ℹ️  Les utilisateurs de test existent déjà (ignoré)"
fi

echo "🎉 Initialisation terminée"
