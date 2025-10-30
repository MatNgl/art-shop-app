import { PartialType } from '@nestjs/swagger';
import { CreateOrderDto } from './create-order.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @ApiProperty({
    enum: ['pending', 'processing', 'accepted', 'refused', 'delivered'],
    example: 'processing',
    required: false,
    description: 'Statut de la commande',
  })
  @IsOptional()
  @IsEnum(['pending', 'processing', 'accepted', 'refused', 'delivered'])
  status?: OrderStatus;
}
