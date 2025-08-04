import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from './admin/admin.module';
import { SellerModule } from './seller/seller.module';
import { CustomerModule } from './customer/customer.module';

@Module({
  imports: [AdminModule, SellerModule, CustomerModule, TypeOrmModule.forRoot({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: '1234',
  database: 'e-commerce',
  autoLoadEntities: true,
  synchronize: true,
}),],
  controllers: [],
  providers: [],
})
export class AppModule {}
