import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  IsObject,
  ValidateNested,
  Min,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentBrand,
} from '../entities/order.entity';

export class CreateOrderItemDto {
  @ApiProperty({ example: 1, description: 'ID du produit' })
  @IsNumber()
  productId: number;

  @ApiProperty({ example: 5, required: false, description: 'ID de la variante' })
  @IsOptional()
  @IsNumber()
  variantId?: number;

  @ApiProperty({ example: 'A4', required: false, description: 'Label de la variante' })
  @IsOptional()
  @IsString()
  variantLabel?: string;

  @ApiProperty({ example: 'Paysage Urbain', description: 'Titre du produit' })
  @IsString()
  title: string;

  @ApiProperty({ example: 450, description: 'Prix unitaire' })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ example: 2, description: 'Quantité' })
  @IsNumber()
  @Min(1)
  qty: number;

  @ApiProperty({
    example: 'https://example.com/image.jpg',
    required: false,
    description: 'URL de l\'image',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

class AddressDto {
  @ApiProperty({ example: '10 Avenue des Champs-Élysées' })
  @IsString()
  street: string;

  @ApiProperty({ example: 'Paris' })
  @IsString()
  city: string;

  @ApiProperty({ example: '75008' })
  @IsString()
  zip: string;

  @ApiProperty({ example: 'France' })
  @IsString()
  country: string;
}

class CustomerDto {
  @ApiProperty({ example: 'Nathan' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Naegellen' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '06 55 44 33 22', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ type: AddressDto })
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}

class PaymentDto {
  @ApiProperty({ enum: ['card', 'paypal', 'bank'], example: 'card' })
  @IsEnum(['card', 'paypal', 'bank'])
  method: PaymentMethod;

  @ApiProperty({ example: '4242', required: false, description: '4 derniers chiffres' })
  @IsOptional()
  @IsString()
  last4?: string;

  @ApiProperty({
    enum: ['visa', 'mastercard', 'amex', 'paypal', 'other'],
    example: 'visa',
    required: false,
  })
  @IsOptional()
  @IsEnum(['visa', 'mastercard', 'amex', 'paypal', 'other'])
  brand?: PaymentBrand;
}

export class CreateOrderDto {
  @ApiProperty({ type: [CreateOrderItemDto], description: 'Liste des items de commande' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiProperty({ example: 630, description: 'Sous-total (somme des produits)' })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({ example: 0, description: 'Taxes', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxes?: number;

  @ApiProperty({ example: 12, description: 'Frais de port', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shipping?: number;

  @ApiProperty({ example: 642, description: 'Total TTC' })
  @IsNumber()
  @Min(0)
  total: number;

  @ApiProperty({ type: CustomerDto, description: 'Informations client' })
  @IsObject()
  @ValidateNested()
  @Type(() => CustomerDto)
  customer: CustomerDto;

  @ApiProperty({ type: PaymentDto, description: 'Informations de paiement' })
  @IsObject()
  @ValidateNested()
  @Type(() => PaymentDto)
  payment: PaymentDto;

  @ApiProperty({ required: false, description: 'Notes de commande' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    enum: ['product', 'subscription'],
    example: 'product',
    required: false,
    description: 'Type de commande',
  })
  @IsOptional()
  @IsEnum(['product', 'subscription'])
  orderType?: OrderType;

  @ApiProperty({
    example: 'sub-123',
    required: false,
    description: 'ID de l\'abonnement si orderType === subscription',
  })
  @IsOptional()
  @IsString()
  subscriptionId?: string;
}
