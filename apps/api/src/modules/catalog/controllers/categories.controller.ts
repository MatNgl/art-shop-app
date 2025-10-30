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
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from '../services/categories.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { Public } from '../../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('categories')
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Créer une nouvelle catégorie' })
  @ApiResponse({ status: 201, description: 'Catégorie créée' })
  @ApiResponse({ status: 409, description: 'Slug déjà utilisé' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
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
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Mettre à jour une catégorie' })
  @ApiResponse({ status: 200, description: 'Catégorie mise à jour' })
  @ApiResponse({ status: 404, description: 'Catégorie introuvable' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Supprimer une catégorie' })
  @ApiResponse({ status: 200, description: 'Catégorie supprimée' })
  @ApiResponse({ status: 404, description: 'Catégorie introuvable' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
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
  findSubCategories(@Param('parentId', ParseUUIDPipe) parentId: string) {
    return this.categoriesService.findSubCategories(parentId);
  }

  @Public()
  @Get(':parentId/subcategories/count')
  @ApiOperation({ summary: 'Compter le nombre de sous-catégories d\'une catégorie' })
  @ApiResponse({ status: 200, description: 'Nombre de sous-catégories' })
  @ApiResponse({ status: 404, description: 'Catégorie parent introuvable' })
  async countSubCategories(@Param('parentId', ParseUUIDPipe) parentId: string) {
    const count = await this.categoriesService.countSubCategories(parentId);
    return { count };
  }

  @Post(':parentId/subcategories')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Créer une sous-catégorie sous une catégorie parent' })
  @ApiResponse({ status: 201, description: 'Sous-catégorie créée' })
  @ApiResponse({ status: 404, description: 'Catégorie parent introuvable' })
  @ApiResponse({ status: 409, description: 'Slug déjà utilisé' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  createSubCategory(
    @Param('parentId', ParseUUIDPipe) parentId: string,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.createSubCategory(parentId, createCategoryDto);
  }

  @Patch(':parentId/subcategories/:subCategoryId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Mettre à jour une sous-catégorie' })
  @ApiResponse({ status: 200, description: 'Sous-catégorie mise à jour' })
  @ApiResponse({ status: 404, description: 'Catégorie ou sous-catégorie introuvable' })
  @ApiResponse({ status: 409, description: 'La sous-catégorie n\'appartient pas à ce parent' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  updateSubCategory(
    @Param('parentId', ParseUUIDPipe) parentId: string,
    @Param('subCategoryId', ParseUUIDPipe) subCategoryId: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.updateSubCategory(parentId, subCategoryId, updateCategoryDto);
  }

  @Delete(':parentId/subcategories/:subCategoryId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Supprimer une sous-catégorie' })
  @ApiResponse({ status: 200, description: 'Sous-catégorie supprimée' })
  @ApiResponse({ status: 404, description: 'Catégorie ou sous-catégorie introuvable' })
  @ApiResponse({ status: 409, description: 'La sous-catégorie n\'appartient pas à ce parent' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  removeSubCategory(
    @Param('parentId', ParseUUIDPipe) parentId: string,
    @Param('subCategoryId', ParseUUIDPipe) subCategoryId: string,
  ) {
    return this.categoriesService.removeSubCategory(parentId, subCategoryId);
  }
}
