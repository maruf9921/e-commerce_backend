import { Module } from '@nestjs/common';

import { AdminModule } from './admin/admin.module';
import { SellerModule } from './seller/seller.module';
import { CustomerModule } from './customer/customer.module';
import { FileUploadModule } from './seller/Files/file-upload.module';

@Module({
  imports: [AdminModule, SellerModule, CustomerModule, FileUploadModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
