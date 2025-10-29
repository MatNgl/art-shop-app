import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email de l\'utilisateur',
  })
  @IsEmail({}, { message: 'Email invalide' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Mot de passe',
  })
  @IsString()
  @MinLength(1, { message: 'Le mot de passe est requis' })
  password: string;
}
