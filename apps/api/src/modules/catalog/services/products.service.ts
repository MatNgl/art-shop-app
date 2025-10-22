import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { ProductFormat } from '../entities/product-format.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductFormat)
    private readonly productFormatRepository: Repository<ProductFormat>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Vérifier unicité du slug
    const existing = await this.productRepository.findOne({
      where: { slug: createProductDto.slug },
    });
    if (existing) {
      throw new ConflictException('Ce slug est déjà utilisé');
    }

    // Créer le produit sans les formats
    const { formats, ...productData } = createProductDto;
    const product = this.productRepository.create(productData);
    const savedProduct = await this.productRepository.save(product);

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

    return this.findOne(savedProduct.id);
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      relations: ['category', 'productFormats', 'productFormats.format'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'productFormats', 'productFormats.format'],
    });
    if (!product) {
      throw new NotFoundException('Produit introuvable');
    }
    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { slug },
      relations: ['category', 'productFormats', 'productFormats.format'],
    });
    if (!product) {
      throw new NotFoundException('Produit introuvable');
    }
    return product;
  }

  async findByCategory(categoryId: string): Promise<Product[]> {
    return this.productRepository.find({
      where: { categoryId },
      relations: ['category', 'productFormats', 'productFormats.format'],
      order: { name: 'ASC' },
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
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
    const { formats, ...productData } = updateProductDto;
    Object.assign(product, productData);
    await this.productRepository.save(product);

    // Mettre à jour les formats si fournis
    if (formats) {
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

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }
}
