// Script pour remplacer automatiquement AuthService par AuthHttpService
// Usage: node replace-auth-service.js

const fs = require('fs');
const path = require('path');

const filesToReplace = [
  // Guards (déjà fait mais on les garde)
  'src/app/core/guards/auth.guard.ts',
  'src/app/core/guards/admin.guard.ts',

  // Components auth (déjà fait)
  'src/app/features/auth/components/login/login.component.ts',
  'src/app/features/auth/components/register/register.component.ts',
  'src/app/features/auth/components/forgot-password/forgot-password.component.ts',
  'src/app/features/auth/components/reset-password/reset-password.component.ts',
  'src/app/features/auth/components/change-password/change-password.component.ts',

  // Header (déjà fait)
  'src/app/shared/components/header/header.component.ts',
  'src/app/shared/components/sidebar/sidebar.component.ts',
  'src/app/shared/components/footer/footer.component.ts',

  // Services
  'src/app/shared/services/recommendations.service.ts',
  'src/app/shared/services/badge-theme.service.ts',

  // Profile
  'src/app/features/profile/pages/profile-layout/profile-layout.component.ts',
  'src/app/features/profile/pages/profile/profile.component.ts',
  'src/app/features/profile/pages/addresses/profile-addresses.component.ts',
  'src/app/features/profile/pages/subscription/profile-subscription.component.ts',

  // Admin
  'src/app/features/admin/components/users/admin-users.component.ts',
  'src/app/features/admin/components/orders/admin-orders.component.ts',
  'src/app/features/admin/components/dashboard/admin-dashboard.component.ts',
  'src/app/features/admin/components/dashboard/user-stats-widget.component.ts',
  'src/app/features/admin/pages/user-details.page.ts',
  'src/app/features/admin/pages/order-details.page.ts',

  // Cart
  'src/app/features/cart/pages/cart/cart.component.ts',
  'src/app/features/cart/pages/checkout/checkout.component.ts',
  'src/app/features/cart/services/cart-store.ts',
  'src/app/features/cart/services/order-store.ts',

  // Catalog
  'src/app/features/catalog/pages/catalog/catalog.component.ts',
  'src/app/features/catalog/pages/product-detail/product-detail.component.ts',

  // Favorites
  'src/app/features/favorites/pages/favorites-page.component.ts',
  'src/app/features/favorites/services/favorites-store.ts',

  // Home
  'src/app/features/home/components/home.component.ts',
];

const oldImport = /import\s*{\s*AuthService\s*}\s*from\s*['"].*\/auth['"]/g;
const newImport = "import { AuthHttpService as AuthService } from '../../features/auth/services/auth-http.service'";

let count = 0;
let errors = 0;

filesToReplace.forEach(relPath => {
  const fullPath = path.join(__dirname, relPath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Fichier non trouvé: ${relPath}`);
    errors++;
    return;
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8');

    if (content.match(oldImport)) {
      // Calculer le bon chemin relatif vers auth-http.service.ts
      const dir = path.dirname(fullPath);
      const targetPath = path.join(__dirname, 'src/app/features/auth/services/auth-http.service.ts');
      let relativePath = path.relative(dir, targetPath).replace(/\\/g, '/');

      // Ajouter ./ si le chemin ne commence pas par ../
      if (!relativePath.startsWith('..')) {
        relativePath = './' + relativePath;
      }

      // Enlever l'extension .ts
      relativePath = relativePath.replace(/\.ts$/, '');

      content = content.replace(oldImport, `import { AuthHttpService as AuthService } from '${relativePath}'`);

      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ ${relPath}`);
      count++;
    } else {
      console.log(`⏭️  Déjà à jour: ${relPath}`);
    }
  } catch (err) {
    console.error(`❌ Erreur sur ${relPath}:`, err.message);
    errors++;
  }
});

console.log(`\n📊 Résumé: ${count} fichiers modifiés, ${errors} erreurs`);
