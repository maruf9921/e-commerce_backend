import { Module } from '@nestjs/common';
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
//import { ForeignKeyTestModule } from './test/foreign-key-test.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'e_commerce',
      entities: [User, Product],
      synchronize: false, // Set to false when using migrations
      logging: true, // Optional: to see SQL queries
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
