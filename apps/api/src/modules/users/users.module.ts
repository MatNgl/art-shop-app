import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UserAddress } from './entities/user-address.entity';
import { UserPaymentMethod } from './entities/user-payment-method.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserAddress, UserPaymentMethod])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Exporté pour être utilisé dans AuthModule
})
export class UsersModule {}
