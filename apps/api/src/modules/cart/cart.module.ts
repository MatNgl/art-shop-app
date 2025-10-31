import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../catalog/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';

/**
 * CartModule - Module de gestion du panier
 * Réplique CartStore frontend avec persistence BDD
 */
@Module({
  imports: [TypeOrmModule.forFeature([Cart, CartItem, Product, ProductVariant])],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
