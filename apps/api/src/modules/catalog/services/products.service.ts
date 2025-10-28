import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { ProductFormat } from '../entities/product-format.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { ProductCategoryAssociation } from '../entities/product-category-association.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductFormat)
    private readonly productFormatRepository: Repository<ProductFormat>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductCategoryAssociation)
    private readonly productCategoryAssociationRepository: Repository<ProductCategoryAssociation>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Vérifier unicité du slug
    const existing = await this.productRepository.findOne({
      where: { slug: createProductDto.slug },
    });
    if (existing) {
      throw new ConflictException('Ce slug est déjà utilisé');
    }

    // Créer le produit sans les relations
    const { formats, variants, categoryAssociations, ...productData } = createProductDto;
    const product = this.productRepository.create(productData) as Product;
    const savedProduct = (await this.productRepository.save(product)) as Product;

    // Ajouter les formats si fournis
    if (formats && formats.length > 0) {
      const productFormats = formats.map((f) =>
        this.productFormatRepository.create({
          productId: savedProduct.id,
          formatId: f.formatId,
          priceModifier: f.priceModifier,
        }),
      );
      await this.productFormatRepository.save(productFormats);
    }

    // Ajouter les variantes si fournies
    if (variants && variants.length > 0) {
      const productVariants = variants.map((v) =>
        this.productVariantRepository.create({
          productId: savedProduct.id,
          ...v,
        }),
      );
      await this.productVariantRepository.save(productVariants);
    }

    // Ajouter les associations catégories si fournies
    if (categoryAssociations && categoryAssociations.length > 0) {
      const associations = categoryAssociations.map((ca) =>
        this.productCategoryAssociationRepository.create({
          productId: savedProduct.id,
          categoryId: ca.categoryId,
          subCategoryId: ca.subCategoryId,
        }),
      );
      await this.productCategoryAssociationRepository.save(associations);
    }

    return this.findOne(savedProduct.id);
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      relations: ['category', 'productFormats', 'productFormats.format', 'variants', 'categoryAssociations'],
      order: { title: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: [
        'category',
        'productFormats',
        'productFormats.format',
        'variants',
        'categoryAssociations',
        'categoryAssociations.category',
        'categoryAssociations.subCategory',
      ],
    });
    if (!product) {
      throw new NotFoundException('Produit introuvable');
    }
    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { slug },
      relations: [
        'category',
        'productFormats',
        'productFormats.format',
        'variants',
        'categoryAssociations',
        'categoryAssociations.category',
        'categoryAssociations.subCategory',
      ],
    });
    if (!product) {
      throw new NotFoundException('Produit introuvable');
    }
    return product;
  }

  async findByCategory(categoryId: number): Promise<Product[]> {
    return this.productRepository.find({
      where: { categoryId },
      relations: ['category', 'productFormats', 'productFormats.format', 'variants', 'categoryAssociations'],
      order: { title: 'ASC' },
    });
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    // Vérifier unicité du slug si modifié
    if (updateProductDto.slug && updateProductDto.slug !== product.slug) {
      const existing = await this.productRepository.findOne({
        where: { slug: updateProductDto.slug },
      });
      if (existing) {
        throw new ConflictException('Ce slug est déjà utilisé');
      }
    }

    // Mettre à jour le produit
    const { formats, variants, categoryAssociations, ...productData } = updateProductDto;
    Object.assign(product, productData);
    await this.productRepository.save(product);

    // Mettre à jour les formats si fournis
    if (formats !== undefined) {
      // Supprimer les anciens formats
      await this.productFormatRepository.delete({ productId: id });

      // Ajouter les nouveaux formats
      if (formats.length > 0) {
        const productFormats = formats.map((f) =>
          this.productFormatRepository.create({
            productId: id,
            formatId: f.formatId,
            priceModifier: f.priceModifier,
          }),
        );
        await this.productFormatRepository.save(productFormats);
      }
    }

    // Mettre à jour les variantes si fournies
    if (variants !== undefined) {
      // Supprimer les anciennes variantes
      await this.productVariantRepository.delete({ productId: id });

      // Ajouter les nouvelles variantes
      if (variants.length > 0) {
        const productVariants = variants.map((v) =>
          this.productVariantRepository.create({
            productId: id,
            ...v,
          }),
        );
        await this.productVariantRepository.save(productVariants);
      }
    }

    // Mettre à jour les associations catégories si fournies
    if (categoryAssociations !== undefined) {
      // Supprimer les anciennes associations
      await this.productCategoryAssociationRepository.delete({ productId: id });

      // Ajouter les nouvelles associations
      if (categoryAssociations.length > 0) {
        const associations = categoryAssociations.map((ca) =>
          this.productCategoryAssociationRepository.create({
            productId: id,
            categoryId: ca.categoryId,
            subCategoryId: ca.subCategoryId,
          }),
        );
        await this.productCategoryAssociationRepository.save(associations);
      }
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }
}
