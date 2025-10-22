# 🔗 Connexion Frontend → Backend - Guide Complet

## ✅ Ce qui a été fait

### 1. **Services HTTP créés**
- ✅ `AuthHttpService` → Remplace le mock d'authentification
- ✅ `UsersHttpService` → Gestion des utilisateurs (admin)
- ✅ `authInterceptor` → Ajoute automatiquement le JWT aux requêtes
- ✅ `errorInterceptor` → Gère les erreurs 401/403/500

### 2. **Configuration**
- ✅ Intercepteurs configurés dans [main.ts](apps/web/src/main.ts:25)
- ✅ API_URL configurée : `http://localhost:3000/api`

### 3. **Données de test**
- ✅ Fichier SQL créé : [seed-users.sql](apps/api/database/seed-users.sql)
- ✅ Hash bcrypt générés avec salt rounds = 10

---

## 🚀 Étapes pour activer la connexion

### **Étape 1 : Insérer les utilisateurs dans la base de données**

**Option A** - Via Docker (recommandé) :
```bash
docker exec -i artshop-db psql -U artshop_user -d artshop_db < apps/api/database/seed-users.sql
```

**Option B** - Via pgAdmin :
1. Ouvrir pgAdmin : http://localhost:5050
2. Login: `admin@artshop.com` / `admin123`
3. Se connecter au serveur PostgreSQL
4. Ouvrir le Query Tool
5. Copier/coller le contenu de `apps/api/database/seed-users.sql`
6. Exécuter (F5)

**Utilisateurs créés** :
| Email | Password | Role |
|-------|----------|------|
| admin@example.com | admin123 | ADMIN |
| user@example.com | user123 | USER |
| john.doe@example.com | password123 | USER |
| jane.smith@example.com | password456 | USER |

---

### **Étape 2 : Activer les nouveaux services dans le Frontend**

Tu as **2 options** :

#### **Option A - Remplacement direct (RECOMMANDÉ)**

Remplacer toutes les références de `AuthService` par `AuthHttpService` :

```typescript
// AVANT
import { AuthService } from './auth.service';
constructor(private auth: AuthService) {}

// APRÈS
import { AuthHttpService } from './auth-http.service';
constructor(private auth: AuthHttpService) {}
```

**Fichiers à modifier** :
- [apps/web/src/app/features/auth/components/login/login.component.ts]
- [apps/web/src/app/features/auth/components/register/register.component.ts]
- [apps/web/src/app/shared/components/header/header.component.ts]
- [apps/web/src/app/core/guards/auth.guard.ts]
- [apps/web/src/app/core/guards/admin.guard.ts]

#### **Option B - Délégation (Transition douce)**

Modifier `AuthService` pour déléguer vers `AuthHttpService` :

```typescript
// Dans apps/web/src/app/features/auth/services/auth.ts
import { AuthHttpService } from './auth-http.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private httpService = inject(AuthHttpService);

  async login(credentials: LoginRequest) {
    return this.httpService.login(credentials);
  }

  async register(userData: RegisterRequest) {
    return this.httpService.register(userData);
  }

  // ... déléguer toutes les méthodes
}
```

---

### **Étape 3 : Démarrer les services**

```bash
# Terminal 1 - Backend
docker-compose up -d

# Terminal 2 - Frontend (si pas démarré)
cd apps/web
npm run dev
```

---

## 🧪 Tester la connexion

### **Test 1 : Login simple**

1. Ouvrir http://localhost:4200/auth/login
2. Utiliser : `admin@example.com` / `admin123`
3. Cliquer "Se connecter"
4. ✅ Doit rediriger vers la page d'accueil avec user connecté

### **Test 2 : Vérifier le JWT dans la console**

Ouvrir DevTools > Application > LocalStorage :
```
accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
currentUser: {"id":"...","email":"admin@example.com",...}
```

### **Test 3 : Appel API protégé**

```typescript
// Dans la console du navigateur
fetch('http://localhost:3000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
}).then(r => r.json()).then(console.log)
```

✅ Doit retourner les infos de l'utilisateur connecté

---

## 🔄 Flux de connexion complet

```
1. User entre email/password
   ↓
2. Frontend : AuthHttpService.login(credentials)
   ↓
3. HTTP POST → http://localhost:3000/api/auth/login
   ↓
4. Backend : Vérifie email/password dans PostgreSQL
   ↓
5. Backend : Génère JWT (15min) + Refresh token (7j)
   ↓
6. Backend retourne: { success: true, user: {...}, accessToken: "..." }
   ↓
7. Frontend : Sauvegarde dans localStorage
   ↓
8. Frontend : Met à jour currentUser signal
   ↓
9. Toutes les requêtes suivantes incluent automatiquement :
   Authorization: Bearer <token>
   ↓
10. Backend : JwtAuthGuard valide le token
    ↓
11. ✅ Accès aux routes protégées
```

---

## 📁 Fichiers créés/modifiés

### **Nouveaux fichiers** :
1. `apps/web/src/app/core/interceptors/auth.interceptor.ts` - JWT automatique
2. `apps/web/src/app/features/auth/services/auth-http.service.ts` - Service Auth HTTP
3. `apps/web/src/app/features/auth/services/users-http.service.ts` - Service Users HTTP
4. `apps/api/database/seed-users.sql` - Données de test
5. `apps/api/database/generate-hashes.js` - Générateur de hash bcrypt

### **Fichiers modifiés** :
1. `apps/web/src/main.ts` - Configuration des intercepteurs
2. `apps/web/src/app/core/interceptors/error.interceptor.ts` - Gestion 401/403

---

## 🐛 Troubleshooting

### **Erreur : CORS Policy**
```
Access to fetch at 'http://localhost:3000/api/auth/login' has been blocked by CORS
```
**Solution** : Vérifier que le backend démarre bien avec CORS configuré pour `http://localhost:4200`

### **Erreur : 401 Unauthorized**
```
Error: Unauthorized
```
**Solutions** :
1. Vérifier que le token est bien dans localStorage
2. Vérifier que l'intercepteur auth est bien configuré
3. Vérifier que le JWT n'est pas expiré (15min max)

### **Erreur : Cannot find module 'bcrypt'**
```bash
cd apps/api
npm install bcrypt
```

### **Les hash ne correspondent pas**
Regénérer les hash :
```bash
cd apps/api
node database/generate-hashes.js
```

---

## 📝 Notes importantes

1. **JWT Expiration** :
   - Access token : 15 minutes
   - Refresh token : 7 jours
   - Implémenter le refresh automatique si besoin

2. **Sécurité** :
   - Les mots de passe ne sont JAMAIS envoyés en clair au frontend
   - Le backend utilise bcrypt avec 10 rounds de salt
   - Les tokens JWT sont signés avec une clé secrète

3. **localStorage vs sessionStorage** :
   - Actuellement utilise `localStorage` (persist après fermeture)
   - Pour plus de sécurité : passer à `sessionStorage`

---

## ✅ Checklist finale

- [ ] Docker containers démarrés (`docker-compose up -d`)
- [ ] Users insérés dans PostgreSQL
- [ ] Frontend modifié pour utiliser AuthHttpService
- [ ] Test login avec `admin@example.com` / `admin123`
- [ ] Vérifier le token dans localStorage
- [ ] Test d'une route protégée (ex: `/admin`)

---

**Prochaines étapes** :
1. Connecter le module Catalog (Products, Categories, Formats)
2. Implémenter le refresh automatique du token
3. Ajouter les guards sur les routes admin du backend
