import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/image.entity';
import { Seller } from '../seller/entities/seller.entity';
import { User } from '../users/entities/unified-user.entity';
import { ImageUploadModule } from './image-upload/image-upload.module';
@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductImage, Seller, User]), ImageUploadModule],
  providers: [ProductService],
  controllers: [ProductController]
})

export class ProductModule {}
