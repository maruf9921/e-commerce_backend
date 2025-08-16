import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { Product } from './entities/product.entity';
import { Repository, ILike } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductDto, UpdateProductDto } from './dto/product.dto';
import { Seller } from '../seller/entities/seller.entity';

@Injectable()
export class ProductService {


  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Seller)
    private sellerRepository: Repository<Seller>,
        // @InjectRepository(Category)
        // private categoryRepository: Repository<Category>,
    ) {}

    async getAllProducts(): Promise<Product[]> {
        return await this.productRepository.find({
            relations: ['seller'],
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                isActive: true,
                imageUrl: true,
                createdAt: true,
                updatedAt: true,
                sellerId: true,
                seller: {
                    id: true,
                    username: true,
                    fullName: true,
                    phone: true,
                    isActive: true
                    // password excluded for security
                }
            },
            order: {
                createdAt: 'DESC'
            }
        });
    }

    async createProduct(productDto: ProductDto): Promise<Product> {
      const seller = await this.sellerRepository.findOne({ 
        where: { id: productDto.sellerId },
        select: ['id', 'username', 'fullName','phone','isActive']
      });
      
      if (!seller) {
          throw new NotFoundException(`Seller with ID '${productDto.sellerId}' not found`);
      }

      if(!seller.isActive){
        throw new ConflictException('Seller account is inactive');
      }

      const product = this.productRepository.create({
        name: productDto.name,
        description: productDto.description,
        price: productDto.price,
        isActive: productDto.isActive ?? true,
        imageUrl: productDto.imageUrl,
        sellerId: seller.id,
        seller: seller
      });
      
      const savedProduct = await this.productRepository.save(product);
      return await this.getProductById(savedProduct.id);
    }

    async updateProduct(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
        const product = await this.productRepository.findOne({ 
            where: { id },
            relations: ['seller']
        });
        
        if (!product) {
            throw new NotFoundException(`Product with ID '${id}' not found`);
        }
        
        Object.assign(product, updateProductDto);
        return await this.productRepository.save(product);
    }

    async getProductById(id: number): Promise<Product> {
        const product = await this.productRepository.findOne({
            where: { id },
            relations: ['seller'],
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                isActive: true,
                imageUrl: true,
                createdAt: true,
                updatedAt: true,
                sellerId: true,
                seller: {
                    id: true,
                    username: true,
                    fullName: true,
                    phone: true,
                    isActive: true
                }
            }
        });

        if (!product) {
            throw new NotFoundException(`Product with ID '${id}' not found`);
        }

        return product;
    }

    async getProductsBySellerId(sellerId: string): Promise<Product[]> {
        const seller = await this.sellerRepository.findOne({
            where: { id: sellerId }
        });

        if (!seller) {
            throw new NotFoundException(`Seller with ID '${sellerId}' not found`);
        }

        return await this.productRepository.find({
            where: { sellerId },
            relations: ['seller'],
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                isActive: true,
                imageUrl: true,
                createdAt: true,
                updatedAt: true,
                sellerId: true,
                seller: {
                    id: true,
                    username: true,
                    fullName: true,
                    phone: true,
                    isActive: true
                }
            },
            order: {
                createdAt: 'DESC'
            }
        });
    }

    async searchProductsByName(name: string): Promise<Product[]> {
        return await this.productRepository.find({
            where: {
                name: ILike(`%${name}%`)
            },
            relations: ['seller'],
            select: {
                seller: {
                    id: true,
                    username: true,
                    fullName: true,
                    phone: true,
                    isActive: true
                }
            }
        });
    }

    async deleteProduct(id: number): Promise<{ message: string; deletedProduct: Product }> {
        const product = await this.getProductById(id);
        
        await this.productRepository.remove(product);
        
        return {
            message: `Product '${product.name}' has been successfully deleted`,
            deletedProduct: product
        };
    }
}