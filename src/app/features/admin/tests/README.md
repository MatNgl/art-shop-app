# Tests Admin - Documentation

## 📋 Approche de Test Actuelle

Pour l'instant, nous utilisons une approche de **tests manuels** plutôt que des tests unitaires automatisés.

### Pourquoi des tests manuels ?

1. ✅ L'implémentation des composants évolue rapidement
2. ✅ Les tests unitaires nécessitent beaucoup de maintenance
3. ✅ Les tests manuels sont plus flexibles pendant le développement
4. ✅ La checklist permet une validation complète des fonctionnalités
5. ✅ Pas d'erreurs de compilation dues à des tests obsolètes

## ✅ Checklist de Tests Manuels

**Consultez le fichier [../TESTING_CHECKLIST.md](../TESTING_CHECKLIST.md)** pour la liste complète des tests à effectuer manuellement.

Cette checklist couvre :

- ✅ **Produits** : Création/modification (avec et sans variantes)
- ✅ **Catégories** : Création/modification (avec sous-catégories)
- ✅ **Associations** : Produits-catégories multi-niveaux
- ✅ **Actions** : Suspension/activation
- ✅ **Validation** : Tous les formulaires
- ✅ **Erreurs** : Gestion complète
- ✅ **UX** : Performance, accessibilité, responsive

## 🔄 Migration vers Tests Automatisés (Futur)

Quand l'implémentation sera stabilisée, nous pourrons créer des tests automatisés.

### Ordre de Priorité

**Phase 1 : Tests Critiques (Haute priorité)**

```typescript
// 1. Services
describe('ProductService', () => {
  it('should create product with variants', async () => {
    const product = await service.createProduct({...});
    expect(product.variants?.length).toBe(2);
  });
});

// 2. Guards
describe('AdminGuard', () => {
  it('should allow admin users', () => {
    authService.currentUser.set({ role: 'ADMIN' });
    expect(guard.canActivate()).toBe(true);
  });
});

// 3. Interceptors
describe('ErrorInterceptor', () => {
  it('should map HTTP errors to user messages', () => {
    // ...
  });
});
```

**Phase 2 : Tests Composants (Moyenne priorité)**

Se concentrer sur :
- La logique métier, pas l'UI
- Les computed signals
- Les méthodes publiques importantes
- Les validations custom

**Phase 3 : Tests E2E (Basse priorité)**

À implémenter avec Cypress/Playwright :
- Workflows complets utilisateur
- Tests de régression
- Tests cross-browser

### Structure Recommandée

```
src/app/features/admin/
├── components/
│   ├── products/
│   │   ├── product-form.component.ts
│   │   └── product-form.component.spec.ts (futur)
│   └── categories/
│       ├── category-form.component.ts
│       └── category-form.component.spec.ts (futur)
├── services/
│   └── ... (tests prioritaires)
├── guards/
│   └── ... (tests prioritaires)
└── tests/
    ├── README.md (ce fichier)
    └── e2e/ (futur)
```

## 🎯 Objectifs de Couverture (Futur)

Quand les tests automatisés seront en place :

| Catégorie | Objectif |
|-----------|----------|
| Services | > 80% |
| Guards/Interceptors | > 90% |
| Pipes/Directives | > 85% |
| Composants | > 60% |
| **Global** | **> 70%** |

## 🚀 Commandes Tests

```bash
# Lancer les tests existants (autres features)
npm test

# Tests avec couverture
npm test -- --code-coverage

# Tests headless (CI)
npm test -- --no-watch --browsers=ChromeHeadless

# Build (vérifie qu'il n'y a pas d'erreurs TS)
npm run build
```

## 📚 Ressources

- [Angular Testing Guide](https://angular.dev/guide/testing)
- [Jasmine Documentation](https://jasmine.github.io/)
- [Testing Library Angular](https://testing-library.com/docs/angular-testing-library/intro/)
- [Cypress](https://www.cypress.io/) ou [Playwright](https://playwright.dev/)

## 🎯 Roadmap

1. ✅ ~~Créer checklist de tests manuels~~ (Fait)
2. ✅ ~~Supprimer tests obsolètes~~ (Fait)
3. ⏳ Stabiliser l'implémentation des composants
4. ⏳ Créer tests de services en premier
5. ⏳ Ajouter tests de guards et interceptors
6. ⏳ Progressivement ajouter tests de composants
7. ⏳ Configurer Cypress/Playwright pour E2E

---

## 📝 Note Importante

**La qualité du code ne dépend pas uniquement des tests automatisés.**

Notre approche actuelle privilégie :
- ✅ Architecture propre (feature-based, DDD)
- ✅ Typage strict (pas de `any`)
- ✅ Composants standalone
- ✅ Signals pour la gestion d'état
- ✅ Reactive Forms avec validation
- ✅ Accessibilité (ARIA, keyboard nav)
- ✅ Code review et checklist manuelle

Ces pratiques garantissent déjà un haut niveau de qualité, même sans tests automatisés.
