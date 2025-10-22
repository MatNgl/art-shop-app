import { PartialType, OmitType, ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email', 'password'] as const),
) {
  @ApiProperty({
    example: true,
    description: 'Activer/Désactiver le compte',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
