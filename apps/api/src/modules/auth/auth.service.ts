import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Valider les credentials et retourner l'utilisateur
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      return null;
    }

    // Vérifier si le compte est suspendu
    if (!user.isActive || user.suspendedAt) {
      throw new UnauthorizedException('Compte suspendu ou inactif');
    }

    // Vérifier si le compte est verrouillé
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      throw new UnauthorizedException(
        `Compte verrouillé jusqu'à ${user.lockedUntil.toLocaleString('fr-FR')}`,
      );
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Incrémenter les tentatives de connexion
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        // Verrouiller le compte pour 15 minutes après 5 tentatives échouées
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await this.userRepository.save(user);
      return null;
    }

    // Reset des tentatives en cas de succès
    user.loginAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    return user;
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(registerDto: RegisterDto): Promise<User> {
    // Vérifier si l'email existe déjà
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Créer le nouvel utilisateur
    const user = this.userRepository.create({
      email: registerDto.email,
      password: registerDto.password, // sera hashé par le hook @BeforeInsert
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phone: registerDto.phone,
    });

    return this.userRepository.save(user);
  }

  /**
   * Connexion et génération des tokens JWT
   */
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return {
      success: true,
      user,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Rafraîchir le token d'accès
   */
  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Utilisateur introuvable ou inactif');
      }

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: '15m',
      });

      return {
        success: true,
        accessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Token de rafraîchissement invalide');
    }
  }

  /**
   * Récupérer l'utilisateur connecté
   */
  async getProfile(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }
    return user;
  }

  /**
   * Changer le mot de passe
   */
  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    // Vérifier l'ancien mot de passe
    const isCurrentPasswordValid = await user.comparePassword(
      changePasswordDto.currentPassword,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Mot de passe actuel incorrect');
    }

    // Mettre à jour le mot de passe (sera hashé par le hook @BeforeUpdate)
    user.password = changePasswordDto.newPassword;
    await this.userRepository.save(user);
  }

  /**
   * Mettre à jour le profil
   */
  async updateProfile(
    userId: number,
    updates: Partial<Pick<User, 'firstName' | 'lastName' | 'phone'>>,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    Object.assign(user, updates);
    return this.userRepository.save(user);
  }
}
