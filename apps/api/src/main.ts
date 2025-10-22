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
    .addTag('auth', 'Authentification & Utilisateurs')
    .addTag('catalog', 'Catalogue (Produits, Catégories, Formats)')
    .addTag('cart', 'Panier & Commandes')
    .addTag('subscriptions', 'Abonnements & Boxes')
    .addTag('promotions', 'Promotions & Codes promo')
    .addTag('fidelity', 'Fidélité & Récompenses')
    .addTag('admin', 'Administration')
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
