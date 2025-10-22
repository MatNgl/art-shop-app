import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'OldPass123!',
    description: 'Ancien mot de passe',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    example: 'NewPass123!',
    description: 'Nouveau mot de passe (min 8 caractères)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' })
  newPassword: string;
}
