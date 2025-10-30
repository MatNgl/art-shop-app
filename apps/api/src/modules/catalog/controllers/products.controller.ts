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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from '../services/products.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { Public } from '../../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Créer un nouveau produit' })
  @ApiResponse({ status: 201, description: 'Produit créé' })
  @ApiResponse({ status: 409, description: 'Slug déjà utilisé' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Récupérer tous les produits (avec filtres)' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filtrer par catégorie (UUID)' })
  @ApiResponse({ status: 200, description: 'Liste des produits' })
  findAll(@Query('categoryId') categoryId?: string) {
    if (categoryId) {
      return this.productsService.findByCategory(categoryId);
    }
    return this.productsService.findAll();
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Récupérer un produit par son slug' })
  @ApiResponse({ status: 200, description: 'Produit trouvé' })
  @ApiResponse({ status: 404, description: 'Produit introuvable' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un produit par son ID' })
  @ApiResponse({ status: 200, description: 'Produit trouvé' })
  @ApiResponse({ status: 404, description: 'Produit introuvable' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Mettre à jour un produit' })
  @ApiResponse({ status: 200, description: 'Produit mis à jour' })
  @ApiResponse({ status: 404, description: 'Produit introuvable' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Supprimer un produit' })
  @ApiResponse({ status: 200, description: 'Produit supprimé' })
  @ApiResponse({ status: 404, description: 'Produit introuvable' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
