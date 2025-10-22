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
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Public()
  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une catégorie' })
  @ApiResponse({ status: 200, description: 'Catégorie mise à jour' })
  @ApiResponse({ status: 404, description: 'Catégorie introuvable' })
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Public()
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une catégorie' })
  @ApiResponse({ status: 200, description: 'Catégorie supprimée' })
  @ApiResponse({ status: 404, description: 'Catégorie introuvable' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
