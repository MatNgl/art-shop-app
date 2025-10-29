import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  AuthResponseDto,
  AuthErrorResponseDto,
} from './dto/auth-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

@ApiTags('auth')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 inscriptions max par heure
  @Post('register')
  @ApiOperation({ summary: 'Inscription d\'un nouvel utilisateur' })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur créé avec succès',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email déjà utilisé',
    type: AuthErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Trop de tentatives - Maximum 3 inscriptions par heure',
  })
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    const loginResult = await this.authService.login({
      email: registerDto.email,
      password: registerDto.password,
    });

    return loginResult;
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentatives max par minute
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Connexion réussie',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Identifiants incorrects',
    type: AuthErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Trop de tentatives - Maximum 5 connexions par minute',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rafraîchir le token d\'accès' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token rafraîchi avec succès',
  })
  @ApiResponse({
    status: 401,
    description: 'Token invalide',
  })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer le profil de l\'utilisateur connecté' })
  @ApiResponse({
    status: 200,
    description: 'Profil utilisateur',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  async getProfile(@CurrentUser() user: User) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Changer le mot de passe' })
  @ApiResponse({
    status: 204,
    description: 'Mot de passe modifié avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Mot de passe actuel incorrect',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(user.id, changePasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour le profil' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        phone: { type: 'string', example: '0612345678' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Profil mis à jour',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updates: Partial<Pick<User, 'firstName' | 'lastName' | 'phone'>>,
  ) {
    return this.authService.updateProfile(user.id, updates);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Déconnexion (invalidation côté client)' })
  @ApiResponse({
    status: 204,
    description: 'Déconnexion réussie',
  })
  async logout() {
    // La déconnexion JWT se fait côté client en supprimant le token
    // Ici on pourrait ajouter une blacklist de tokens si nécessaire
    return;
  }
}
