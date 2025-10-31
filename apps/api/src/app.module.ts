import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { OrdersModule } from './modules/orders/orders.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { CartModule } from './modules/cart/cart.module';
import { PaymentModule } from './modules/payment/payment.module';

@Module({
  imports: [
    // Configuration des variables d'environnement
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Configuration TypeORM avec ConfigService
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USER', 'artshop_user'),
        password: configService.get('DATABASE_PASSWORD', 'artshop_password'),
        database: configService.get('DATABASE_NAME', 'artshop_db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Géré par init.sql
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // Configuration du Rate Limiting global
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 60 secondes
        limit: 100, // 100 requêtes par minute par défaut
      },
    ]),

    UsersModule,

    AuthModule,

    CatalogModule,

    OrdersModule,

    FavoritesModule,

    PromotionsModule,

    SubscriptionsModule,

    CartModule,

    PaymentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Activer le ThrottlerGuard globalement
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
