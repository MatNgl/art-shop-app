# 🚀 Guide de démarrage rapide - Art Shop

> Démarrez l'application en 5 minutes chrono !

---

## ⚡ Installation express (3 étapes)

### 1️⃣ Cloner et installer

```bash
# Cloner le repo
git clone https://github.com/votre-username/art-shop-app.git
cd art-shop-app

# Installer toutes les dépendances
npm run install:all
```

### 2️⃣ Lancer Docker Desktop

Assurez-vous que **Docker Desktop** est bien lancé sur votre machine.

### 3️⃣ Démarrer l'application

```bash
npm run dev
```

**C'est tout ! 🎉**

---

## 🌐 Accéder à l'application

Après `npm run dev`, attendez ~30 secondes que tous les services démarrent.

Puis ouvrez votre navigateur :

| Service | URL | Infos |
|---------|-----|-------|
| 🎨 **Frontend** | [localhost:4200](http://localhost:4200) | Application Angular |
| 🔌 **API** | [localhost:3000](http://localhost:3000) | Backend NestJS |
| 📚 **Swagger** | [localhost:3000/api](http://localhost:3000/api) | Documentation API |
| 🐘 **Adminer** | [localhost:8080](http://localhost:8080) | Interface DB |

---

## 👤 Connexion

### Compte Admin
- **Email** : `admin@artshop.com`
- **Mot de passe** : `admin123`

### Compte Utilisateur
- **Email** : `user@artshop.com`
- **Mot de passe** : `user123`

---

## 🛑 Arrêter l'application

```bash
npm run docker:down
```

---

## 📋 Commandes utiles

```bash
# Voir les logs en temps réel
npm run docker:logs

# Voir les logs du frontend uniquement
npm run docker:logs:web

# Voir les logs du backend uniquement
npm run docker:logs:api

# Reconstruire les images Docker
npm run dev:build

# Nettoyer complètement Docker
npm run docker:clean
```

---

## 🐛 Problèmes courants

### Docker ne démarre pas

```bash
# Vérifier que Docker Desktop est lancé
docker --version

# Si erreur, redémarrer Docker Desktop
```

### Port déjà utilisé (4200 ou 3000)

```bash
# Trouver et tuer le processus sur le port 4200
# Windows
netstat -ano | findstr :4200
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:4200 | xargs kill -9
```

### Les conteneurs ne se lancent pas

```bash
# Arrêter tous les conteneurs
npm run docker:down

# Nettoyer Docker
npm run docker:clean

# Relancer
npm run dev:build
```

---

## 📖 Documentation complète

Pour plus de détails, consultez :

- **[README.md](./README.md)** : Documentation principale
- **[DOCUMENTATION_FRONTEND.md](./DOCUMENTATION_FRONTEND.md)** : Doc technique frontend

---

**Bon développement ! 🚀**
