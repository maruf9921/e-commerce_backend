import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { Admin } from 'src/admin/admin.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Admin])],
  providers: [ProductService],
  controllers: [ProductController],
})
export class ProductModule {}
