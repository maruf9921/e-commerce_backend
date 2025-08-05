import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from './admin/admin.module';
import { SellerModule } from './seller/seller.module';
import { CustomerModule } from './customer/customer.module';
import { FileUploadModule } from './seller/Files/file-upload.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'e-commerce_backend',
      autoLoadEntities:true ,
      synchronize: true, // Set to false in production
      logging: false, // Optional: to see SQL queries
    }),
    AdminModule,
    SellerModule,
    CustomerModule,
    FileUploadModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
