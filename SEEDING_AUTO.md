# 🎉 Seeding Automatique de la Base de Données

## ✅ Configuration Terminée

La base de données PostgreSQL est maintenant configurée pour **insérer automatiquement les utilisateurs de test** lors du premier lancement !

## 🚀 Comment ça fonctionne ?

### Lors du premier `docker-compose up`

PostgreSQL exécute automatiquement tous les fichiers `.sql` dans l'ordre alphabétique :

```
/docker-entrypoint-initdb.d/
├── 01-init.sql          ← Création des tables
└── 02-seed-users.sql    ← Insertion des utilisateurs de test
```

### Configuration dans docker-compose.yml

```yaml
db:
  volumes:
    - postgres-data:/var/lib/postgresql/data
    - ./apps/api/database/init.sql:/docker-entrypoint-initdb.d/01-init.sql
    - ./apps/api/database/seed-users.sql:/docker-entrypoint-initdb.d/02-seed-users.sql
```

## 📋 Utilisateurs Créés Automatiquement

| Email | Mot de passe | Rôle | Nom |
|-------|-------------|------|-----|
| `admin@example.com` | `admin123` | admin | Matthéo Naegellen |
| `user@example.com` | `user123` | user | User Name |

## 🔧 Commandes Makefile

### Lancer l'application (avec seeding auto)
```bash
make dev
# ou
docker-compose up -d
```

### Vérifier les utilisateurs créés
```bash
make db-shell
# Puis :
SELECT email, role FROM users;
```

### Réinsérer manuellement (si besoin)
```bash
make db-seed
```

### Réinitialiser complètement
```bash
make db-reset
```

## 📝 Logs de Vérification

Pour vérifier que le seeding s'est bien exécuté :

```bash
docker logs artshop-db | grep -E "seed|INSERT|Users created"
```

Vous devriez voir :
```
/usr/local/bin/docker-entrypoint.sh: running /docker-entrypoint-initdb.d/02-seed-users.sql
INSERT 0 4
 Users created
```

## 🎯 Utilisation

### Test de connexion API

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

Réponse attendue :
```json
{
  "success": true,
  "user": { ... },
  "accessToken": "eyJhbGciOiJI...",
  "refreshToken": "eyJhbGciOiJI..."
}
```

### Test de connexion Frontend

1. Ouvrir http://localhost:4200/auth/login
2. Email : `admin@example.com`
3. Mot de passe : `admin123`
4. ✅ Connexion réussie !

## ⚠️ Important

### Le seeding ne s'exécute QU'UNE SEULE FOIS

- Lors de la **première création** du volume PostgreSQL
- Si vous faites `docker-compose restart`, le seeding ne se ré-exécute PAS
- Pour re-exécuter le seeding, il faut **supprimer le volume** :

```bash
docker-compose down -v    # Supprime les volumes
docker-compose up -d      # Recrée tout avec seeding
```

### En Production

⚠️ **NE JAMAIS** utiliser ces comptes de test en production !

- Changez les mots de passe
- Utilisez des variables d'environnement
- Créez des comptes admin sécurisés

## 🔐 Sécurité

Les mots de passe sont hashés avec **bcrypt** (10 rounds) :

```javascript
// generate-hashes.js
const bcrypt = require('bcrypt');
const password = 'admin123';
const hash = await bcrypt.hash(password, 10);
// $2b$10$mBYqUvcW1zxXm0YNss2SCOSgzwpLhPgi4OgcFYTuvSBKd.URio.ay
```

## 📊 Architecture

```
┌─────────────────────────────────────────┐
│  docker-compose up -d                   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  PostgreSQL Container (artshop-db)      │
│  ┌───────────────────────────────────┐  │
│  │ Volume: postgres-data créé        │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ /docker-entrypoint-initdb.d/      │  │
│  │   ├── 01-init.sql       ✅        │  │
│  │   └── 02-seed-users.sql ✅        │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Base de données prête avec :           │
│  ✅ Tables créées                       │
│  ✅ Utilisateurs de test insérés        │
│  ✅ Mots de passe hashés                │
└─────────────────────────────────────────┘
```

## 🐛 Dépannage

### Les utilisateurs ne sont pas créés

```bash
# Vérifier les logs
docker logs artshop-db

# Vérifier le volume
docker volume ls | grep postgres

# Réinitialiser complètement
make db-reset
```

### Erreur "duplicate key"

Cela signifie que les utilisateurs existent déjà. C'est normal si vous relancez Docker.

Pour recommencer à zéro :
```bash
docker-compose down -v
docker-compose up -d
```

---

**Prochaines étapes** : Connecter les modules Catalog, Cart et Orders au backend 🚀
