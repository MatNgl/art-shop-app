import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Vérifier unicité du slug
    const existing = await this.categoryRepository.findOne({
      where: { slug: createCategoryDto.slug },
    });
    if (existing) {
      throw new ConflictException('Ce slug est déjà utilisé');
    }

    // Vérifier que le parent existe si fourni
    if (createCategoryDto.parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: createCategoryDto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('Catégorie parente introuvable');
      }
    }

    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      relations: ['parent', 'children'],
      order: { name: 'ASC' },
    });
  }

  async findRootCategories(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { parentId: IsNull() },
      relations: ['children'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });
    if (!category) {
      throw new NotFoundException('Catégorie introuvable');
    }
    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { slug },
      relations: ['parent', 'children'],
    });
    if (!category) {
      throw new NotFoundException('Catégorie introuvable');
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    // Vérifier unicité du slug si modifié
    if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
      const existing = await this.categoryRepository.findOne({
        where: { slug: updateCategoryDto.slug },
      });
      if (existing) {
        throw new ConflictException('Ce slug est déjà utilisé');
      }
    }

    // Vérifier que le nouveau parent existe si fourni
    if (updateCategoryDto.parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: updateCategoryDto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('Catégorie parente introuvable');
      }
      // Empêcher la création de boucles (une catégorie ne peut pas être son propre parent)
      if (updateCategoryDto.parentId === id) {
        throw new ConflictException('Une catégorie ne peut pas être son propre parent');
      }
    }

    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
  }

  // ============================================
  // MÉTHODES SPÉCIFIQUES AUX SOUS-CATÉGORIES
  // ============================================

  /**
   * Récupérer toutes les sous-catégories d'une catégorie parent
   */
  async findSubCategories(parentId: string): Promise<Category[]> {
    const parent = await this.findOne(parentId);
    return this.categoryRepository.find({
      where: { parentId: parent.id },
      order: { name: 'ASC' },
    });
  }

  /**
   * Créer une sous-catégorie sous une catégorie parent
   */
  async createSubCategory(
    parentId: string,
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    // Vérifier que le parent existe
    const parent = await this.findOne(parentId);

    // Créer la sous-catégorie avec le parentId
    const subCategoryDto = {
      ...createCategoryDto,
      parentId: parent.id,
    };

    return this.create(subCategoryDto);
  }

  /**
   * Mettre à jour une sous-catégorie
   */
  async updateSubCategory(
    parentId: string,
    subCategoryId: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    // Vérifier que le parent existe
    await this.findOne(parentId);

    // Vérifier que la sous-catégorie existe et appartient bien au parent
    const subCategory = await this.findOne(subCategoryId);
    if (subCategory.parentId !== parentId) {
      throw new ConflictException(
        'Cette sous-catégorie n\'appartient pas à la catégorie parent spécifiée',
      );
    }

    // Empêcher de changer le parent via cette méthode
    const { parentId: _, ...updateDto } = updateCategoryDto;

    return this.update(subCategoryId, updateDto);
  }

  /**
   * Supprimer une sous-catégorie
   */
  async removeSubCategory(parentId: string, subCategoryId: string): Promise<void> {
    // Vérifier que le parent existe
    await this.findOne(parentId);

    // Vérifier que la sous-catégorie existe et appartient bien au parent
    const subCategory = await this.findOne(subCategoryId);
    if (subCategory.parentId !== parentId) {
      throw new ConflictException(
        'Cette sous-catégorie n\'appartient pas à la catégorie parent spécifiée',
      );
    }

    await this.remove(subCategoryId);
  }

  /**
   * Récupérer l'arbre complet des catégories (hiérarchie)
   */
  async getCategoryTree(): Promise<Category[]> {
    // Récupérer uniquement les catégories racines avec leurs enfants
    return this.categoryRepository.find({
      where: { parentId: IsNull() },
      relations: ['children'],
      order: { name: 'ASC' },
    });
  }

  /**
   * Compter le nombre de sous-catégories d'une catégorie
   */
  async countSubCategories(parentId: string): Promise<number> {
    await this.findOne(parentId);
    return this.categoryRepository.count({
      where: { parentId },
    });
  }
}
