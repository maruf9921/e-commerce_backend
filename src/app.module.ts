import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from './admin/admin.module';
import { SellerModule } from './seller/seller.module';
import { CustomerModule } from './customer/customer.module';
import { FileUploadModule } from './seller/Files/file-upload.module';
import { ProductModule } from './product/product.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MaillerModule } from './mailler/mailler.module';
import { OrderModule } from './order/order.module';
import { FinancialModule } from './financial/financial.module';
import { NotificationModule } from './notification/notification.module';
import { CartModule } from './cart/cart.module';
import { MaillerService } from './mailler/mailler.service';
import { MaillerController } from './mailler/mailler.controller';
import { Product } from './product/entities/product.entity';
import { ProductImage } from './product/entities/image.entity';
import { User } from './users/entities/unified-user.entity';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { LoginLog } from './auth/entities/login-log.entity';
import { Order } from './order/entities/order.entity';
import { OrderItem } from './order/entities/order-item.entity';
import { Payment } from './order/entities/payment.entity';
import { FinancialRecord } from './order/entities/financial-record.entity';
import { Cart } from './cart/entities/cart.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'e_commerce',
      entities: [User, Product, ProductImage, RefreshToken, LoginLog, Order, OrderItem, Payment, FinancialRecord, Cart],
      synchronize: false,
      logging: true,
    }),
    AdminModule,
    SellerModule,
    CustomerModule,
    FileUploadModule,
    ProductModule,
    UsersModule,
    AuthModule,
    MaillerModule,
    OrderModule,
    FinancialModule,
    NotificationModule,
    CartModule,
  ],
  controllers: [MaillerController],
  providers: [MaillerService],
})
export class AppModule {}
