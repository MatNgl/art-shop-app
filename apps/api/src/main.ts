import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true,
  });

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Préfixe global API
  app.setGlobalPrefix('api');

  // Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('ArtShop API')
    .setDescription(`API REST pour la plateforme e-commerce ArtShop

📍 **Modules implémentés:**
- 🔐 Authentification & Autorisation (JWT, refresh tokens, rôles)
- 👥 Gestion des Utilisateurs (CRUD, profils, suspension)
- 🎨 Produits & Variantes (formats, stock, prix)
- 📁 Catégories & Sous-catégories
- 📐 Formats d'impression (A3, A4, A5, custom)
- 🛒 Commandes (lifecycle complet)
- ⭐ Favoris (wishlist utilisateur)
- 🎁 Promotions (10+ scopes, codes promo, calcul dynamique)
- 📦 Abonnements (boxes mensuelles, points fidélité)

🚧 **Modules à créer:**
- 🛍️ Panier (CartModule) - Gestion panier multi-variantes
- 💳 Paiement (PaymentModule) - Stripe/PayPal integration
- 📦 Expédition (ShippingModule) - Calcul frais, tracking
- 💬 Avis & Notes (ReviewsModule) - Reviews produits (optionnel)
- 📊 Analytics (AnalyticsModule) - Statistiques ventes, CA
- 🔔 Notifications (NotificationsModule) - Email, push, SMS
- 🎨 Artistes (ArtistsModule) - Profils artistes, portfolios
- 📰 Blog (BlogModule) - Articles, actualités art
- 🏆 Loyauté (LoyaltyModule) - Points fidélité, récompenses
- 🎟️ Bons cadeaux (VouchersModule) - Cartes cadeaux
- 📸 Médias (MediaModule) - Upload images, compression
- 🌐 i18n (LocalizationModule) - Multi-langues
- 🔍 Recherche (SearchModule) - Elasticsearch, filtres avancés
    `)
    .setVersion('1.0')
    .addTag('auth', '🔐 Authentification & Autorisation')
    .addTag('users', '👥 Gestion des Utilisateurs')
    .addTag('products', '🎨 Produits & Variantes')
    .addTag('categories', '📁 Catégories')
    .addTag('formats', '📐 Formats d\'impression')
    .addTag('orders', '🛒 Commandes')
    .addTag('favorites', '⭐ Favoris')
    .addTag('promotions', '🎁 Promotions & Codes promo')
    .addTag('subscriptions', '📦 Abonnements & Boxes mensuelles')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 API démarrée sur http://localhost:${port}`);
  console.log(`📚 Documentation Swagger: http://localhost:${port}/api/docs`);
}
bootstrap();
