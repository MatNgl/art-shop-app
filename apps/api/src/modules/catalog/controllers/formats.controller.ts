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
import { FormatsService } from '../services/formats.service';
import { CreateFormatDto } from '../dto/create-format.dto';
import { UpdateFormatDto } from '../dto/update-format.dto';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('formats')
@Controller('formats')
@UseInterceptors(ClassSerializerInterceptor)
export class FormatsController {
  constructor(private readonly formatsService: FormatsService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Créer un nouveau format d\'impression' })
  @ApiResponse({ status: 201, description: 'Format créé' })
  create(@Body() createFormatDto: CreateFormatDto) {
    return this.formatsService.create(createFormatDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Récupérer tous les formats' })
  @ApiResponse({ status: 200, description: 'Liste des formats' })
  findAll() {
    return this.formatsService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un format par son ID' })
  @ApiResponse({ status: 200, description: 'Format trouvé' })
  @ApiResponse({ status: 404, description: 'Format introuvable' })
  findOne(@Param('id') id: string) {
    return this.formatsService.findOne(id);
  }

  @Public()
  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un format' })
  @ApiResponse({ status: 200, description: 'Format mis à jour' })
  @ApiResponse({ status: 404, description: 'Format introuvable' })
  update(@Param('id') id: string, @Body() updateFormatDto: UpdateFormatDto) {
    return this.formatsService.update(id, updateFormatDto);
  }

  @Public()
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un format' })
  @ApiResponse({ status: 200, description: 'Format supprimé' })
  @ApiResponse({ status: 404, description: 'Format introuvable' })
  remove(@Param('id') id: string) {
    return this.formatsService.remove(id);
  }
}
