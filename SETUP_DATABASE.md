# Configuration de la Base de Données

## 🚀 Seeding Automatique

La base de données est maintenant **seedée automatiquement** au démarrage de Docker !

### Comment ça marche ?

Lorsque vous lancez `docker-compose up`, PostgreSQL exécute automatiquement :

1. **`01-init.sql`** - Création des tables et schéma de base
2. **`02-seed-users.sql`** - Insertion des utilisateurs de test

Les fichiers dans `/docker-entrypoint-initdb.d/` sont exécutés **uniquement lors de la première création du volume**.

## 📝 Utilisateurs de Test

Après le premier lancement, ces utilisateurs sont disponibles :

| Email | Mot de passe | Rôle | Description |
|-------|-------------|------|-------------|
| `admin@example.com` | `admin123` | admin | Administrateur avec tous les droits |
| `user@example.com` | `user123` | user | Utilisateur standard |

## 🔧 Commandes Utiles

### Première installation (avec seeding automatique)
```bash
docker-compose up -d
```

### Vérifier que les utilisateurs sont créés
```bash
make db-shell
# Puis dans PostgreSQL :
SELECT email, role FROM users;
```

### Réinsérer les données manuellement (si nécessaire)
```bash
make db-seed
```

### Réinitialiser complètement la base
```bash
make db-reset
```
⚠️ **Attention** : Cette commande supprime TOUTES les données !

## 🔄 Cas d'usage

### 1️⃣ Premier lancement du projet
```bash
git clone <repo>
cd art-shop-app
docker-compose up -d
```
✅ Les utilisateurs de test sont automatiquement créés

### 2️⃣ La base existe déjà
Si vous relancez `docker-compose up`, le seeding **ne se ré-exécute pas** (car le volume existe).

### 3️⃣ Vous voulez recommencer à zéro
```bash
make db-reset
```
Cela supprime le volume et recrée la base avec le seeding.

### 4️⃣ Vous avez supprimé les utilisateurs par erreur
```bash
make db-seed
```
Cela réinsère les utilisateurs de test.

## 🐛 Debugging

### Vérifier si le seeding s'est bien exécuté
```bash
docker logs artshop-db | grep -i "seed\|insert"
```

### Voir les tables créées
```bash
make db-shell
\dt
```

### Compter les utilisateurs
```bash
docker exec artshop-db psql -U artshop_user -d artshop_db -c "SELECT COUNT(*) FROM users;"
```

## ⚙️ Modifier les Données de Test

Pour ajouter/modifier les utilisateurs de test :

1. Éditez `apps/api/database/seed-users.sql`
2. Générez les nouveaux hashes bcrypt :
   ```bash
   cd apps/api/database
   node generate-hashes.js
   ```
3. Copiez les hashes dans `seed-users.sql`
4. Réinitialisez la base :
   ```bash
   make db-reset
   ```

## 🔐 Sécurité

- Les mots de passe sont hashés avec **bcrypt** (10 rounds)
- Les tokens JWT sont signés avec une clé secrète (à changer en production)
- Les utilisateurs de test sont **uniquement pour le développement**

---

**Note** : En production, ne jamais utiliser ces comptes de test !
