# 🎯 Prompt de reprise - Backend Art Shop

> Copie-colle ce prompt à Claude quand tu reviens travailler sur le backend

---

```markdown
# CONTEXTE PROJET ART SHOP - BACKEND

Je travaille sur le backend NestJS d'une application e-commerce d'œuvres d'art.

## État actuel du projet

**Architecture :**
- Monorepo : `apps/web/` (Angular 20) + `apps/api/` (NestJS 10)
- ORM : TypeORM + PostgreSQL 16
- Auth : JWT avec Passport
- Types partagés : `packages/shared/src/index.ts`

**Modules implémentés (4/10) :**
1. ✅ **Auth** : JWT login/register/refresh (7 endpoints)
2. ✅ **Users** : CRUD + addresses + payment methods (8 endpoints)
3. ✅ **Catalog** : Products, categories, formats (23 endpoints)
4. ✅ **Orders** : Gestion commandes (9 endpoints)

**Modules manquants (6/10) :**
5. ❌ **Favorites** : Sauvegarde produits favoris
6. ❌ **Promotions** : Codes promo + validation
7. ❌ **Fidelity** : Points de fidélité + récompenses
8. ❌ **Subscriptions** : Abonnements mensuels
9. ❌ **Notifications** : Système de notifications admin
10. ❌ **Messaging** : Messagerie entre admins

**Problème CRITIQUE :**
🔴 30% des endpoints sont publics sans guards (n'importe qui peut créer/modifier/supprimer)

## Documentation disponible

1. **BACKEND_ROADMAP.md** : Plan détaillé par phases (15 jours)
2. **BACKEND_STATUS.md** : État actuel + métriques
3. **DOCUMENTATION_FRONTEND.md** : Features frontend (60+ pages)
4. **README.md** : Setup + commandes Docker

## Ma prochaine tâche

[INDIQUE ICI CE QUE TU VEUX FAIRE]

Exemples :
- "Phase 0 - Tâche 0.1 : Protéger les routes admin avec guards"
- "Phase 1 - Module 1.1 : Créer le module Favorites complet"
- "Phase 1 - Module 1.2.2 : Implémenter la logique métier du service Promotions"

## Règles strictes à respecter

### Architecture
1. ✅ Toujours utiliser TypeORM (pas Prisma)
2. ✅ Respecter la structure : `entities/`, `dto/`, `service.ts`, `controller.ts`, `module.ts`
3. ✅ Nommer les fichiers en kebab-case : `create-user.dto.ts`, `user.entity.ts`
4. ✅ Classes en PascalCase : `CreateUserDto`, `UserEntity`

### Sécurité
5. ✅ Tous les endpoints admin doivent avoir `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN)`
6. ✅ Endpoints publics doivent avoir `@Public()` explicitement
7. ✅ Valider TOUS les DTOs avec `class-validator` (@IsString, @IsEmail, @MinLength, etc.)
8. ✅ Ne JAMAIS logger les mots de passe ou tokens

### Code quality
9. ✅ Documenter avec Swagger : `@ApiOperation()`, `@ApiResponse()`, `@ApiProperty()`
10. ✅ Gérer les erreurs : `throw new BadRequestException()`, `NotFoundException`, etc.
11. ✅ Importer les types depuis `@art-shop/shared` quand ils existent
12. ❌ NE PAS créer de code dupliqué
13. ❌ NE PAS modifier les entities existantes sans raison valide
14. ❌ NE PAS faire de debug sale (console.log, code commenté)

### Pattern à suivre

Pour chaque nouveau module :

**1. Entity** (`entities/mon-entite.entity.ts`)
```typescript
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('ma_table')
export class MonEntite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

**2. DTOs** (`dto/create-xxx.dto.ts`)
```typescript
import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateXxxDto {
  @ApiProperty({ example: 'Exemple' })
  @IsString()
  @MinLength(3)
  name: string;
}
```

**3. Service** (`mon-module.service.ts`)
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MonModuleService {
  constructor(
    @InjectRepository(MonEntite)
    private readonly repo: Repository<MonEntite>,
  ) {}

  async create(dto: CreateXxxDto): Promise<MonEntite> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async findAll(): Promise<MonEntite[]> {
    return this.repo.find();
  }

  async findOne(id: number): Promise<MonEntite> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Entity ${id} not found`);
    }
    return entity;
  }
}
```

**4. Controller** (`mon-module.controller.ts`)
```typescript
import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('mon-endpoint')
@ApiTags('mon-module')
export class MonModuleController {
  constructor(private readonly service: MonModuleService) {}

  // Lecture publique
  @Get()
  @ApiOperation({ summary: 'Get all items' })
  async findAll() {
    return this.service.findAll();
  }

  // Création admin uniquement
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create item (admin only)' })
  @ApiSecurity('bearer')
  async create(@Body() dto: CreateXxxDto) {
    return this.service.create(dto);
  }
}
```

**5. Module** (`mon-module.module.ts`)
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([MonEntite])],
  controllers: [MonModuleController],
  providers: [MonModuleService],
  exports: [MonModuleService],
})
export class MonModuleModule {}
```

**6. Enregistrer** dans `app.module.ts`
```typescript
import { MonModuleModule } from './modules/mon-module/mon-module.module';

@Module({
  imports: [
    // ... autres modules
    MonModuleModule,
  ],
})
```

## Commandes utiles

```bash
# Dev backend
cd apps/api
npm run start:dev

# Lancer tout avec Docker
npm run dev

# Voir les logs
npm run docker:logs:api

# Shell PostgreSQL
npm run db:shell

# Build
npm run build

# Lint
npm run lint
```

## Ce que j'attends de toi

1. **Analyser** la tâche que j'ai indiquée ci-dessus
2. **Lire** le fichier `BACKEND_ROADMAP.md` pour voir le plan détaillé
3. **Créer/modifier** les fichiers nécessaires en respectant les règles
4. **Expliquer** ce que tu fais étape par étape
5. **Vérifier** que le code compile et respecte les bonnes pratiques

## Checklist avant de finir

- [ ] Code compile (`npm run build`)
- [ ] DTOs ont validation
- [ ] Guards sur endpoints admin
- [ ] Swagger documenté
- [ ] Pas de console.log()
- [ ] Gestion d'erreurs
- [ ] Nommage cohérent

---

**Merci ! On commence quand tu veux 🚀**
```

---

## 📝 Comment utiliser ce prompt

1. **Copie** tout le contenu du bloc markdown ci-dessus (de `# CONTEXTE` à `**Merci !**`)
2. **Colle** dans une nouvelle conversation avec Claude
3. **Remplace** `[INDIQUE ICI CE QUE TU VEUX FAIRE]` par ta tâche précise
4. **Envoie** le message

### Exemples de tâches à indiquer

**Pour sécuriser :**
```
Phase 0 - Tâche 0.1 : Ajouter les guards JwtAuthGuard et RolesGuard
sur tous les endpoints admin dans users.controller.ts, products.controller.ts
et categories.controller.ts
```

**Pour créer un module :**
```
Phase 1 - Module 1.1 : Créer le module Favorites complet avec :
- Entity Favorite (user_id, product_id, created_at)
- Service avec méthodes toggle(), findByUser(), isFavorite()
- Controller avec 3 endpoints : GET /favorites, POST /favorites/:id, DELETE /favorites/:id
- Module + enregistrement dans app.module.ts
```

**Pour une feature spécifique :**
```
Phase 1 - Module 1.2.2 : Implémenter la logique métier du service Promotions :
- Méthode validateCode() pour vérifier un code promo
- Méthode applyPromotion() pour calculer la réduction
- Gestion des scopes (site-wide, category, product)
- Logique buy-x-get-y
```

---

## 💡 Conseils

### Si Claude a besoin de contexte supplémentaire

Ajoute dans le prompt :
```
Avant de commencer, lis les fichiers suivants :
- apps/api/src/modules/auth/auth.controller.ts (exemple de guards)
- apps/api/src/modules/users/users.controller.ts (exemple de CRUD)
- BACKEND_ROADMAP.md (plan détaillé de la tâche)
```

### Si tu veux qu'il soit plus guidé

Ajoute :
```
Procède étape par étape :
1. Montre-moi d'abord le code de l'entity
2. Attends ma validation
3. Puis le DTO
4. Puis le service
5. Etc.
```

### Si tu veux qu'il soit plus autonome

Ajoute :
```
Crée tous les fichiers d'un coup et montre-moi le résultat final.
Utilise le pattern décrit ci-dessus.
```

---

**Ce prompt est optimisé pour :**
- ✅ Donner tout le contexte nécessaire
- ✅ Définir les règles strictes
- ✅ Montrer les patterns à suivre
- ✅ Éviter les erreurs courantes
- ✅ Maintenir la cohérence du code

**Mets à jour la section `[INDIQUE ICI CE QUE TU VEUX FAIRE]` à chaque nouvelle session !**
