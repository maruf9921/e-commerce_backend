import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { Admin } from 'src/admin/admin.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Admin) private adminRepo: Repository<Admin>,
  ) {}

  // Create Product for a given admin
  async createProduct(adminId: number, productData: Partial<Product>) {
    const admin = await this.adminRepo.findOne({ where: { id: adminId } });
    if (!admin) throw new NotFoundException('Admin not found');

    if (productData.price <= 0) {
    throw new BadRequestException('Price must be greater than 0');
  }

    const product = this.productRepo.create({ ...productData, admin });
    return this.productRepo.save(product);
  }

  // Get products by admin
  async getProductsByAdmin(adminId: number) {
    return this.productRepo.find({ where: { admin: { id: adminId } } });
  }

  // Delete a product
  async deleteProduct(id: number) {
    const result = await this.productRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return { message: 'Product deleted successfully' };
  }
}
