import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';
import { FinancialRecord } from './entities/financial-record.entity';
import { Product } from '../product/entities/product.entity';
import { User } from '../users/entities/unified-user.entity';
import { Cart } from '../cart/entities/cart.entity';
import { NotificationModule } from '../notification/notification.module';
import { MaillerModule } from '../mailler/mailler.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Payment,
      FinancialRecord,
      Product,
      User,
      Cart
    ]),
    NotificationModule,
    MaillerModule
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService]
})
export class OrderModule {}