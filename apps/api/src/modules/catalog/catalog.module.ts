import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { PrintFormat } from './entities/print-format.entity';
import { Product } from './entities/product.entity';
import { ProductFormat } from './entities/product-format.entity';
import { CategoriesService } from './services/categories.service';
import { FormatsService } from './services/formats.service';
import { ProductsService } from './services/products.service';
import { CategoriesController } from './controllers/categories.controller';
import { FormatsController } from './controllers/formats.controller';
import { ProductsController } from './controllers/products.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, PrintFormat, Product, ProductFormat]),
  ],
  providers: [CategoriesService, FormatsService, ProductsService],
  controllers: [CategoriesController, FormatsController, ProductsController],
  exports: [CategoriesService, FormatsService, ProductsService],
})
export class CatalogModule {}
