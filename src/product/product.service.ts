import { Role } from '../users/entities/role.enum';
import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { Product } from './entities/product.entity';
import { Repository, ILike } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductDto, UpdateProductDto } from './dto/product.dto';
// Removed Seller import, use User for seller logic
import { User } from '../users/entities/unified-user.entity';
import { CreateProductDto } from './dto/product.dto';
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

    // NEW: Create product using authenticated user from JWT
    async createProductWithAuth(createProductDto: CreateProductDto, authenticatedUser: any): Promise<Product> {
        // Verify the authenticated user exists and is active (ADMIN or SELLER)
        const user = await this.userRepository.findOne({ 
            where: { 
                id: authenticatedUser.id
            },
            select: ['id', 'username', 'phone', 'isActive', 'role', 'sellerId']
        });

        if (!user) {
            throw new NotFoundException(`User with ID '${authenticatedUser.id}' not found`);
        }

        if (!user.isActive) {
            throw new ConflictException('User account is inactive');
        }

        // Handle different user roles
        if (user.role === Role.ADMIN) {
            // For ADMIN users, create product without seller relationship initially
            const product = this.productRepository.create({
                name: createProductDto.name,
                description: createProductDto.description,
                price: createProductDto.price,
                isActive: createProductDto.isActive ?? true,
                imageUrl: createProductDto.imageUrl,
                userId: user.id, // Use admin's primary key
            });

            try {
                const savedProduct = await this.productRepository.save(product);
                // Now load the product with seller relationship
                return await this.productRepository.findOne({
                    where: { id: savedProduct.id },
                    relations: ['seller']
                });
            } catch (error) {
                if (error.code === '23503') {
                    throw new ConflictException('Invalid user ID provided');
                }
                throw error;
            }
        } else if (user.role === Role.SELLER) {
            // For SELLER users, use their seller ID to create products
            if (!user.sellerId) {
                throw new ConflictException('Seller ID is required for seller users');
            }

            const product = this.productRepository.create({
                name: createProductDto.name,
                description: createProductDto.description,
                price: createProductDto.price,
                isActive: createProductDto.isActive ?? true,
                imageUrl: createProductDto.imageUrl,
                seller: user,
                userId: user.id, // Use seller's primary key
            });

            try {
                const savedProduct = await this.productRepository.save(product);
                return await this.productRepository.findOne({
                    where: { id: savedProduct.id },
                    relations: ['seller']
                });
            } catch (error) {
                if (error.code === '23503') {
                    throw new ConflictException('Invalid seller ID provided');
                }
                throw error;
            }
        } else {
            throw new ConflictException('Only ADMIN and SELLER users can create products');
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
        const user = await this.userRepository.findOne({
            where: { id: Number(sellerId) }
        });

        if (!user) {
            throw new NotFoundException(`User with ID '${sellerId}' not found`);
        }

        // For admin users, return products created by admin (using primary key)
        if (user.role === Role.ADMIN) {
            return await this.productRepository.find({
                where: { userId: user.id }, // Admin's products using primary key
                relations: ['seller'],
                order: {
                    createdAt: 'DESC'
                }
            });
        }

        // For seller users, return only their products (using primary key)
        return await this.productRepository.find({
            where: { userId: user.id }, // Seller's products using primary key
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

    async getProductImage1(id: number): Promise<string> {
        const product = await this.productRepository.findOne({
            where: { id: id },
            select: ['id', 'name', 'imageUrl']
        });

        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        if (!product.imageUrl) {
            throw new NotFoundException(`No image found for product with ID ${id}`);
        }

        return product.imageUrl;
    }

    async getProductImage(id: number) {
    // Example: Map product ID to image filename
    // In real code, fetch from DB
    const imageMap = {
      5: '1755224860078-Screenshot from 2025-06-24 01-51-42.png',
      // Add more mappings as needed
    };
    const filename = imageMap[id];
    if (!filename) {
      return { image: null };
    }
    // Construct the image URL
    return {
      image: `http://localhost:4000/image/${filename}`,
    };
  }
}