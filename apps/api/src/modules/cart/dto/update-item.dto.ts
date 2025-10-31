import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO pour modifier la quantité d'un item
 * Réplique CartStore.setQty() frontend
 */
export class UpdateItemQuantityDto {
  @ApiProperty({
    description: 'Nouvelle quantité',
    example: 3,
    minimum: 1,
    maximum: 99,
  })
  @IsNumber()
  @Min(1, { message: 'La quantité doit être au minimum de 1' })
  @Max(99, { message: 'La quantité maximum est de 99' })
  quantity: number;
}
