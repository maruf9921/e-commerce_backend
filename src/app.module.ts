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
import { MaillerService } from './mailler/mailler.service';
import { MaillerController } from './mailler/mailler.controller';
import { Product } from './product/entities/product.entity';
import { User } from './users/entities/unified-user.entity';

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
      entities: [User, Product],
      synchronize: false,
      logging: false,
    }),
    AdminModule,
    SellerModule,
    CustomerModule,
    FileUploadModule,
    ProductModule,
    UsersModule,
    AuthModule,
    MaillerModule,
  ],
  controllers: [MaillerController],
  providers: [MaillerService],
})
export class AppModule {}
