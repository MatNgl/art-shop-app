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
    .setDescription('API REST pour la plateforme e-commerce ArtShop')
    .setVersion('1.0')
    .addTag('auth', '🔐 Authentification & Autorisation')
    .addTag('users', '👥 Gestion des Utilisateurs')
    .addTag('products', '🎨 Produits')
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
