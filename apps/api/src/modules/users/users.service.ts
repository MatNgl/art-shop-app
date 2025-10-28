import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Créer un nouvel utilisateur
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Vérifier si l'email existe déjà
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  /**
   * Récupérer tous les utilisateurs
   */
  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Récupérer un utilisateur par ID
   */
  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} introuvable`);
    }

    return user;
  }

  /**
   * Récupérer un utilisateur par email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * Mettre à jour un utilisateur
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    Object.assign(user, updateUserDto);

    return this.userRepository.save(user);
  }

  /**
   * Suspendre un utilisateur
   */
  async suspend(
    id: number,
    suspendedBy: number,
    reason: string,
  ): Promise<User> {
    const user = await this.findOne(id);

    user.isActive = false;
    user.suspendedAt = new Date();
    user.suspendedBy = suspendedBy;
    user.suspensionReason = reason;

    return this.userRepository.save(user);
  }

  /**
   * Réactiver un utilisateur suspendu
   */
  async reactivate(id: number): Promise<User> {
    const user = await this.findOne(id);

    user.isActive = true;
    user.suspendedAt = null;
    user.suspendedBy = null;
    user.suspensionReason = null;

    return this.userRepository.save(user);
  }

  /**
   * Supprimer un utilisateur (soft delete possible avec isActive)
   */
  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  /**
   * Enregistrer une tentative de connexion
   */
  async recordLoginAttempt(id: number, ipAddress: string): Promise<void> {
    const user = await this.findOne(id);

    user.lastLoginAt = new Date();
    user.lastLoginIp = ipAddress;
    user.loginAttempts = 0; // Réinitialiser les tentatives échouées

    await this.userRepository.save(user);
  }

  /**
   * Incrémenter les tentatives de connexion échouées
   */
  async incrementFailedAttempts(email: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) return;

    user.loginAttempts += 1;

    // Bloquer le compte après 5 tentatives échouées (1 heure)
    if (user.loginAttempts >= 5) {
      user.lockedUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 heure
    }

    await this.userRepository.save(user);
  }

  /**
   * Vérifier si le compte est bloqué
   */
  async isAccountLocked(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    if (!user || !user.lockedUntil) return false;

    return user.lockedUntil > new Date();
  }

  /**
   * Compter le nombre total d'utilisateurs
   */
  async count(): Promise<number> {
    return this.userRepository.count();
  }

  /**
   * Statistiques utilisateurs (pour dashboard admin)
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    suspended: number;
    admins: number;
  }> {
    const [total, active, suspended, admins] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { isActive: true } }),
      this.userRepository.count({ where: { isActive: false } }),
      this.userRepository.count({ where: { role: UserRole.ADMIN } }),
    ]);

    return { total, active, suspended, admins };
  }
}
