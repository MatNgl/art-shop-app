import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  Matches,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email de l\'utilisateur (unique)',
  })
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Mot de passe (min 8 caractères)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  password: string;

  @ApiProperty({
    example: 'John',
    description: 'Prénom',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Nom',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({
    example: '0612345678',
    description: 'Numéro de téléphone',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^(\+33|0)[1-9](\d{2}){4}$/, {
    message: 'Numéro de téléphone invalide (format français)',
  })
  phone?: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    description: 'Rôle de l\'utilisateur',
    required: false,
    default: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Rôle invalide (user ou admin)' })
  role?: UserRole;
}
