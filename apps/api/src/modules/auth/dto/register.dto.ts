import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email de l\'utilisateur (unique)',
  })
  @IsEmail({}, { message: 'Email invalide' })
  @Transform(({ value }) => value?.toLowerCase().trim())
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
    description: 'Numéro de téléphone',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim().replace(/\s/g, ''))
  @Matches(/^(\+33|0)[1-9](\d{2}){4}$/, {
    message: 'Numéro de téléphone invalide (format français)',
  })
  phone?: string;
}
