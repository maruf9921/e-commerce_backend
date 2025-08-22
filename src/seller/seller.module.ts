import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerController } from './seller.controller';
import { SellerService } from './seller.service';
import { User } from '../users/entities/unified-user.entity';
import { UsersModule } from '../users/users.module';
import { Product } from '../product/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Product]), UsersModule],
  controllers: [SellerController],
  providers: [SellerService],
  exports: [SellerService],
})
export class SellerModule {}
