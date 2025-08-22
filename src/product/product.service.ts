import { Role } from '../users/entities/role.enum';
import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { Product } from './entities/product.entity';
import { Repository, ILike } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductDto, UpdateProductDto } from './dto/product.dto';
// Removed Seller import, use User for seller logic
import { User } from '../users/entities/unified-user.entity';
@Injectable()
export class ProductService {


  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    // Removed Seller repository, use User repository for sellers
        // @InjectRepository(Category)
        // private categoryRepository: Repository<Category>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
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
                userId: true,
                seller: {
                    id: true,
                    username: true,
                    phone: true,
                    isActive: true
                    
                }
            },
            order: {
                createdAt: 'DESC'
            }
        });
    }

    async createProduct(productDto: ProductDto): Promise<Product> {
      // First, verify the seller exists and is active
            const seller = await this.userRepository.findOne({ 
                where: { id: Number(productDto.userId), role: Role.SELLER },
                select: ['id', 'username', 'phone', 'isActive']
            });
      
            if (!seller) {
                    throw new NotFoundException(`Seller with ID '${productDto.userId}' not found`);
            }

            if (!seller.isActive) {
                throw new ConflictException('Seller account is inactive');
            }

            // Create product with seller relationship and userId
            const product = this.productRepository.create({
                name: productDto.name,
                description: productDto.description,
                price: productDto.price,
                isActive: productDto.isActive ?? true,
                imageUrl: productDto.imageUrl,
                seller: seller,
                userId: seller.id,
            });
      
            try {
                const savedProduct = await this.productRepository.save(product);
                // Return with seller relationship loaded
                return await this.productRepository.findOne({
                    where: { id: savedProduct.id },
                    relations: ['seller']
                });
            } catch (error) {
                if (error.code === '23503') { // Foreign key violation
                    throw new ConflictException('Invalid seller ID provided');
                }
                throw error;
            }
    }

    async updateProduct(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
        const product = await this.productRepository.findOne({ 
            where: { id },
        relations: ['seller'],
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
                userId: true,
                seller: {
                    id: true,
                    username: true,
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
        const seller = await this.userRepository.findOne({
            where: { id: Number(sellerId), role: Role.SELLER }
        });

        if (!seller) {
            throw new NotFoundException(`Seller with ID '${sellerId}' not found`);
        }

        return await this.productRepository.find({
            where: { userId: seller.id },
            relations: ['seller'],
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

    // Many-to-One Relationship Methods
    
    // Get products by seller username
    async getProductsBySellerUsername(username: string): Promise<Product[]> {
        const seller = await this.userRepository.findOne({
            where: { username, role: Role.SELLER }
        });

        if (!seller) {
            throw new NotFoundException(`Seller with username '${username}' not found`);
        }

        return await this.productRepository.find({
            where: { seller: seller },
            relations: ['seller'],
        });
    }

    // Get only active products with seller details
    async getActiveProductsWithSeller(): Promise<Product[]> {
        return await this.productRepository.find({
            where: { isActive: true },
        relations: ['seller'],
            // Removed select block for simplicity
        });
    }

    // Get product with full seller details
    async getProductWithSellerDetails(productId: number): Promise<Product> {
        const product = await this.productRepository.findOne({
            where: { id: productId },
            relations: ['seller'],
        });

        if (!product) {
            throw new NotFoundException(`Product with ID ${productId} not found`);
        }

        return product;
    }

    // Get products grouped by seller
    async getProductsGroupedBySeller(): Promise<any[]> {
        const results = await this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.seller', 'seller')
            .select([
                'seller.id',
                'seller.username', 
                'seller.phone',
                'seller.isActive',
                'COUNT(product.id) as productCount'
            ])
            .groupBy('seller.id, seller.username, seller.fullName, seller.phone, seller.isActive')
            .getRawMany();

        return results;
    }

    // Search products by seller name
    async searchProductsBySellerName(sellerName: string): Promise<Product[]> {
        return await this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.seller', 'seller')
            .where('seller.fullName ILIKE :name OR seller.username ILIKE :name', {
                name: `%${sellerName}%`
            })
            .select([
                'product.id',
                'product.name',
                'product.description',
                'product.price',
                'product.isActive',
                'product.imageUrl',
                'seller.id',
                'seller.username',
                'seller.phone',
                'seller.isActive'
            ])
            .getMany();
    }
}