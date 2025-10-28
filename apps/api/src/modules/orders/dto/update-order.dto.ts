import { PartialType } from '@nestjs/swagger';
import { CreateOrderDto } from './create-order.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.PROCESSING,
    required: false,
    description: 'Statut de la commande',
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiProperty({
    example: 'FR123456789',
    required: false,
    description: 'Numéro de suivi',
  })
  @IsOptional()
  @IsString()
  trackingNumber?: string;
}
