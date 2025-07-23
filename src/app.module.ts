import { Module } from '@nestjs/common';

import { AdminModule } from './admin/admin.module';
import { SellerModule } from './seller/seller.module';
import { CustomerModule } from './customer/customer.module';

@Module({
  imports: [AdminModule, SellerModule, CustomerModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
