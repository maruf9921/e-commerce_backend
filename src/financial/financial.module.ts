import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialController } from './financial.controller';
import { FinancialService } from './financial.service';
import { FinancialRecord } from '../order/entities/financial-record.entity';
import { Order } from '../order/entities/order.entity';
import { OrderItem } from '../order/entities/order-item.entity';
import { Payment } from '../order/entities/payment.entity';
import { User } from '../users/entities/unified-user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FinancialRecord,
      Order,
      OrderItem,
      Payment,
      User
    ])
  ],
  controllers: [FinancialController],
  providers: [FinancialService],
  exports: [FinancialService],
})
export class FinancialModule {}