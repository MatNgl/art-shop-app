import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';

export class CreateOrderDto {
  @ApiProperty({ example: 199.99, description: 'Montant total de la commande' })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty({
    example: '123 Rue Example, 75001 Paris',
    required: false,
    description: 'Adresse de livraison',
  })
  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @ApiProperty({
    example: '123 Rue Example, 75001 Paris',
    required: false,
    description: 'Adresse de facturation',
  })
  @IsOptional()
  @IsString()
  billingAddress?: string;

  @ApiProperty({
    example: 'card',
    required: false,
    description: 'Méthode de paiement',
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({ required: false, description: 'Notes de commande' })
  @IsOptional()
  @IsString()
  notes?: string;
}
