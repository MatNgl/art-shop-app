import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from '../services/payment.service';
import { CreatePaymentIntentDto } from '../dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from '../dto/confirm-payment.dto';
import { RefundPaymentDto } from '../dto/refund-payment.dto';
import { PaymentIntentResponseDto, PaymentTransactionResponseDto } from '../dto/payment-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User, UserRole } from '../../users/entities/user.entity';
import { Roles } from '../../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('💳 Paiements')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-intent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Créer une intention de paiement',
    description: 'Crée un PaymentIntent Stripe. Supporte: cartes, Apple Pay, Google Pay, Link.',
  })
  @ApiResponse({ status: 200, description: 'PaymentIntent créé', type: PaymentIntentResponseDto })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async createPaymentIntent(
    @CurrentUser() user: User,
    @Body() dto: CreatePaymentIntentDto,
  ): Promise<PaymentIntentResponseDto> {
    return this.paymentService.createPaymentIntent(dto, user.id);
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirmer un paiement',
    description: 'Vérifie le statut d\'un PaymentIntent après confirmation client (Stripe Elements)',
  })
  @ApiResponse({ status: 200, description: 'Paiement confirmé', type: PaymentTransactionResponseDto })
  async confirmPayment(@Body() dto: ConfirmPaymentDto): Promise<PaymentTransactionResponseDto> {
    return this.paymentService.confirmPayment(dto);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Historique de mes paiements' })
  @ApiResponse({ status: 200, description: 'Liste des transactions', type: [PaymentTransactionResponseDto] })
  async getMyTransactions(@CurrentUser() user: User): Promise<PaymentTransactionResponseDto[]> {
    return this.paymentService.findByUser(user.id);
  }

  @Post('refund')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Rembourser un paiement (Admin)' })
  @ApiResponse({ status: 200, description: 'Remboursement effectué', type: PaymentTransactionResponseDto })
  async refundPayment(@Body() dto: RefundPaymentDto): Promise<PaymentTransactionResponseDto> {
    return this.paymentService.refundPayment(dto);
  }
}
