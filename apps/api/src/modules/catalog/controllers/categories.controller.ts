import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoriesService } from '../services/categories.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('categories')
@Controller('categories')
@UseInterceptors(ClassSerializerInterceptor)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle catégorie' })
  @ApiResponse({ status: 201, description: 'Catégorie créée' })
  @ApiResponse({ status: 409, description: 'Slug déjà utilisé' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les catégories' })
  @ApiResponse({ status: 200, description: 'Liste des catégories' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Public()
  @Get('root')
  @ApiOperation({ summary: 'Récupérer les catégories racines (sans parent)' })
  @ApiResponse({ status: 200, description: 'Liste des catégories racines' })
  findRootCategories() {
    return this.categoriesService.findRootCategories();
  }

  @Public()
  @Get('tree')
  @ApiOperation({ summary: 'Récupérer l\'arbre complet des catégories avec leur hiérarchie' })
  @ApiResponse({ status: 200, description: 'Arbre des catégories' })
  getCategoryTree() {
    return this.categoriesService.getCategoryTree();
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Récupérer une catégorie par son slug' })
  @ApiResponse({ status: 200, description: 'Catégorie trouvée' })
  @ApiResponse({ status: 404, description: 'Catégorie introuvable' })
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une catégorie par son ID' })
  @ApiResponse({ status: 200, description: 'Catégorie trouvée' })
  @ApiResponse({ status: 404, description: 'Catégorie introuvable' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Public()
  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une catégorie' })
  @ApiResponse({ status: 200, description: 'Catégorie mise à jour' })
  @ApiResponse({ status: 404, description: 'Catégorie introuvable' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Public()
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une catégorie' })
  @ApiResponse({ status: 200, description: 'Catégorie supprimée' })
  @ApiResponse({ status: 404, description: 'Catégorie introuvable' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }

  // ============================================
  // ENDPOINTS SPÉCIFIQUES AUX SOUS-CATÉGORIES
  // ============================================

  @Public()
  @Get(':parentId/subcategories')
  @ApiOperation({ summary: 'Récupérer toutes les sous-catégories d\'une catégorie parent' })
  @ApiResponse({ status: 200, description: 'Liste des sous-catégories' })
  @ApiResponse({ status: 404, description: 'Catégorie parent introuvable' })
  findSubCategories(@Param('parentId', ParseIntPipe) parentId: number) {
    return this.categoriesService.findSubCategories(parentId);
  }

  @Public()
  @Get(':parentId/subcategories/count')
  @ApiOperation({ summary: 'Compter le nombre de sous-catégories d\'une catégorie' })
  @ApiResponse({ status: 200, description: 'Nombre de sous-catégories' })
  @ApiResponse({ status: 404, description: 'Catégorie parent introuvable' })
  async countSubCategories(@Param('parentId', ParseIntPipe) parentId: number) {
    const count = await this.categoriesService.countSubCategories(parentId);
    return { count };
  }

  @Public()
  @Post(':parentId/subcategories')
  @ApiOperation({ summary: 'Créer une sous-catégorie sous une catégorie parent' })
  @ApiResponse({ status: 201, description: 'Sous-catégorie créée' })
  @ApiResponse({ status: 404, description: 'Catégorie parent introuvable' })
  @ApiResponse({ status: 409, description: 'Slug déjà utilisé' })
  createSubCategory(
    @Param('parentId', ParseIntPipe) parentId: number,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.createSubCategory(parentId, createCategoryDto);
  }

  @Public()
  @Patch(':parentId/subcategories/:subCategoryId')
  @ApiOperation({ summary: 'Mettre à jour une sous-catégorie' })
  @ApiResponse({ status: 200, description: 'Sous-catégorie mise à jour' })
  @ApiResponse({ status: 404, description: 'Catégorie ou sous-catégorie introuvable' })
  @ApiResponse({ status: 409, description: 'La sous-catégorie n\'appartient pas à ce parent' })
  updateSubCategory(
    @Param('parentId', ParseIntPipe) parentId: number,
    @Param('subCategoryId', ParseIntPipe) subCategoryId: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.updateSubCategory(parentId, subCategoryId, updateCategoryDto);
  }

  @Public()
  @Delete(':parentId/subcategories/:subCategoryId')
  @ApiOperation({ summary: 'Supprimer une sous-catégorie' })
  @ApiResponse({ status: 200, description: 'Sous-catégorie supprimée' })
  @ApiResponse({ status: 404, description: 'Catégorie ou sous-catégorie introuvable' })
  @ApiResponse({ status: 409, description: 'La sous-catégorie n\'appartient pas à ce parent' })
  removeSubCategory(
    @Param('parentId', ParseIntPipe) parentId: number,
    @Param('subCategoryId', ParseIntPipe) subCategoryId: number,
  ) {
    return this.categoriesService.removeSubCategory(parentId, subCategoryId);
  }
}
