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
import { Transform } from 'class-transformer';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email de l\'utilisateur (unique)',
  })
  @IsEmail({}, { message: 'Email invalide' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Mot de passe (min 8 caract�res)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caract�res' })
  password: string;

  @ApiProperty({
    example: 'John',
    description: 'Pr�nom',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  firstName?: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Nom',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  lastName?: string;

  @ApiProperty({
    example: '0612345678',
    description: 'Num�ro de t�l�phone',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim().replace(/\s/g, ''))
  @Matches(/^(\+33|0)[1-9](\d{2}){4}$/, {
    message: 'Num�ro de t�l�phone invalide (format fran�ais)',
  })
  phone?: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    description: 'R�le de l\'utilisateur',
    required: false,
    default: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'R�le invalide (user ou admin)' })
  role?: UserRole;
}
