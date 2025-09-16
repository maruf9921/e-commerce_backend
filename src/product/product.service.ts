import { Role } from '../users/entities/role.enum';
import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/image.entity';
import { Repository, ILike, In } from 'typeorm';
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
    @InjectRepository(ProductImage)
    private productImageRepository: Repository<ProductImage>,
    // Removed Seller repository, use User repository for sellers
        // @InjectRepository(Category)
        // private categoryRepository: Repository<Category>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {}

    async getAllProducts(): Promise<Product[]> {
        return await this.productRepository.find({
        relations: ['seller', 'images'],
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                isActive: true,
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

            // Prepare product data with processed image URL and slug
            const preparedData = this.prepareProductData({
                name: productDto.name,
                description: productDto.description,
                price: productDto.price,
                isActive: productDto.isActive,
                seller: seller,
                userId: seller.id,
            });

            // Create product with seller relationship and userId
            const product = this.productRepository.create(preparedData);
      
            try {
                const savedProduct = await this.productRepository.save(product);
                // Return with seller relationship loaded
                return await this.productRepository.findOne({
                    where: { id: (savedProduct as any).id },
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
            throw new NotFoundException(`User with ID ${authenticatedUser.id} not found`);
        }

        if (!user.isActive) {
            throw new UnauthorizedException('User account is deactivated');
        }

        if (user.role !== Role.ADMIN && user.role !== Role.SELLER) {
            throw new UnauthorizedException('Only ADMIN or SELLER can create products');
        }

        // Create the product without images first
        const { images, ...productData } = createProductDto;
        
        // Ensure isActive is properly converted to boolean
        const processedData = {
            ...productData,
            userId: user.id,
            isActive: productData.isActive !== undefined ? Boolean(productData.isActive) : true,
        };
        
        console.log('🔧 Processed Product Data:', processedData);
        
        const product = this.productRepository.create(processedData);

        const savedProduct = await this.productRepository.save(product);

        // If images are provided, create them
        if (images && images.length > 0) {
            const productImages = images.map((imageDto, index) => 
                this.productImageRepository.create({
                    ...imageDto,
                    productId: savedProduct.id,
                    sortOrder: imageDto.sortOrder ?? index,
                })
            );
            await this.productImageRepository.save(productImages);
        }

        // Return the product with images
        return this.productRepository.findOne({
            where: { id: savedProduct.id },
            relations: ['images', 'seller'],
        });
    }

    async updateProduct(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
        const product = await this.productRepository.findOne({ 
            where: { id },
        relations: ['seller'],
        });
        
        if (!product) {
            throw new NotFoundException(`Product with ID '${id}' not found`);
        }
        
        // Prepare update data with processed image URL and slug
        const preparedUpdateData = this.prepareProductData(updateProductDto);
        
        Object.assign(product, preparedUpdateData);
        return await this.productRepository.save(product);
    }

    async getProductById(id: number): Promise<Product> {
        const product = await this.productRepository.findOne({
            where: { id },
        relations: ['seller', 'images'],
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                isActive: true,
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
                relations: ['seller', 'images'],
                order: {
                    createdAt: 'DESC'
                }
            });
        }

        // For seller users, return only their products (using primary key)
        return await this.productRepository.find({
            where: { userId: user.id }, // Seller's products using primary key
            relations: ['seller', 'images'],
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
            relations: ['images'],
            select: ['id', 'name']
        });

        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        if (!product.images || product.images.length === 0) {
            throw new NotFoundException(`No image found for product with ID ${id}`);
        }

        // Return the first active image URL
        const activeImage = product.images.find(img => img.isActive);
        if (!activeImage) {
            throw new NotFoundException(`No active image found for product with ID ${id}`);
        }

        return activeImage.imageUrl;
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

  // Removed duplicate createProduct method to fix compilation error.
  // Helper method to generate slug (moved from entity)
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }

  // Helper method to process image URL (moved from entity)
  private processImageUrl(imageUrl: string): string {
    if (imageUrl && !imageUrl.startsWith('http')) {
      const baseUrl = 'http://localhost:4002';
      return `${baseUrl}/products/static/${imageUrl}`;
    }
    return imageUrl;
  }

  // Helper method to prepare product data (moved from entity hooks)
  private prepareProductData(productData: any): any {
    const preparedData = { ...productData };

    // Process image URL if provided
    if (preparedData.imageUrl) {
      preparedData.imageUrl = this.processImageUrl(preparedData.imageUrl);
    }

    // Generate slug from name if not provided
    if (preparedData.name && !preparedData.slug) {
      preparedData.slug = this.generateSlug(preparedData.name);
    }

    // Set default values
    if (preparedData.isActive === undefined) {
      preparedData.isActive = true;
    }

    return preparedData;
  }

  // NEW: Get all products with their images eagerly loaded
  async getAllProductsWithImages(): Promise<Product[]> {
    return await this.productRepository.find({
      relations: ['seller', 'images'],
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stockQuantity: true,
        category: true,
        isActive: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        seller: {
          id: true,
          username: true,
          phone: true,
          isActive: true
        },
        images: {
          id: true,
          imageUrl: true,
          altText: true,
          isActive: true,
          sortOrder: true,
          createdAt: true
        }
      },
      order: {
        createdAt: 'DESC',
        images: {
          sortOrder: 'ASC'
        }
      }
    });
  }

  // NEW: Get paginated products with images for main page
  async getPaginatedProductsWithImages(page: number = 1, limit: number = 12): Promise<{
    products: Product[],
    totalCount: number,
    totalPages: number,
    currentPage: number,
    hasNextPage: boolean,
    hasPrevPage: boolean
  }> {
    const skip = (page - 1) * limit;
    
    const [products, totalCount] = await this.productRepository.findAndCount({
      relations: ['seller', 'images'],
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stockQuantity: true,
        category: true,
        isActive: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        seller: {
          id: true,
          username: true,
          phone: true,
          isActive: true
        },
        images: {
          id: true,
          imageUrl: true,
          altText: true,
          isActive: true,
          sortOrder: true,
          createdAt: true
        }
      },
      where: {
        isActive: true
      },
      order: {
        createdAt: 'DESC',
        images: {
          sortOrder: 'ASC'
        }
      },
      skip,
      take: limit
    });

    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      products,
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  }

  // NEW: Get specific product with its images
  async getProductWithImages(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['seller', 'images'],
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stockQuantity: true,
        category: true,
        isActive: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        seller: {
          id: true,
          username: true,
          phone: true,
          isActive: true
        },
        images: {
          id: true,
          imageUrl: true,
          altText: true,
          isActive: true,
          sortOrder: true,
          createdAt: true
        }
      },
      order: {
        images: {
          sortOrder: 'ASC'
        }
      }
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  // NEW: Get list of uploaded image files
  async getUploadedImagesList(): Promise<{ images: string[], count: number }> {
    const fs = require('fs');
    const path = require('path');
    
    try {
      const imagesDir = path.join(process.cwd(), 'uploads', 'images');
      
      if (!fs.existsSync(imagesDir)) {
        return { images: [], count: 0 };
      }
      
      const files = fs.readdirSync(imagesDir);
      const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
      });
      
      return {
        images: imageFiles.map(filename => ({
          filename,
          url: `${process.env.BASE_URL || 'http://localhost:4002'}/uploads/images/${filename}`,
          accessUrl: `${process.env.BASE_URL || 'http://localhost:4002'}/image-upload/pic/${filename}`
        })),
        count: imageFiles.length
      };
    } catch (error) {
      console.error('Error reading images directory:', error);
      return { images: [], count: 0 };
    }
  }

  // NEW: Get images for a specific product
  async getProductImages(productId: number) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['images'],
      select: {
        id: true,
        name: true,
        images: {
          id: true,
          imageUrl: true,
          altText: true,
          isActive: true,
          sortOrder: true,
          createdAt: true
        }
      }
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    return {
      productId: product.id,
      productName: product.name,
      images: product.images.sort((a, b) => a.sortOrder - b.sortOrder),
      imageCount: product.images.length
    };
  }

  // ENHANCED SELLER DASHBOARD METHODS

  // Get seller dashboard analytics
  async getSellerDashboardAnalytics(sellerId: number) {
    const products = await this.productRepository.find({
      where: { userId: sellerId },
      relations: ['images']
    });

    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.isActive).length;
    const inactiveProducts = totalProducts - activeProducts;
    const totalStock = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);
    const lowStockProducts = products.filter(p => (p.stockQuantity || 0) < 10).length;
    
    // Calculate total product value
    const totalValue = products.reduce((sum, p) => sum + (p.price * (p.stockQuantity || 0)), 0);

    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
      lowStockProducts,
      totalStock,
      totalValue,
      averagePrice: totalProducts > 0 ? products.reduce((sum, p) => sum + p.price, 0) / totalProducts : 0,
      productsWithImages: products.filter(p => p.images && p.images.length > 0).length,
      productsWithoutImages: products.filter(p => !p.images || p.images.length === 0).length
    };
  }

  // Get seller's top performing products
  async getSellerTopProducts(sellerId: number, limit: number = 10) {
    return await this.productRepository.find({
      where: { 
        userId: sellerId,
        isActive: true
      },
      relations: ['images'],
      order: {
        stockQuantity: 'DESC',
        price: 'DESC'
      },
      take: limit
    });
  }

  // Get seller's low stock products
  async getSellerLowStockProducts(sellerId: number, threshold: number = 10) {
    return await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.userId = :sellerId', { sellerId })
      .andWhere('product.stockQuantity <= :threshold', { threshold })
      .andWhere('product.isActive = true')
      .orderBy('product.stockQuantity', 'ASC')
      .getMany();
  }

  // Bulk update products (for seller dashboard)
  async bulkUpdateProducts(sellerId: number, updates: { productIds: number[], updateData: Partial<Product> }) {
    const { productIds, updateData } = updates;

    // Verify all products belong to the seller
    const products = await this.productRepository.find({
      where: { 
        id: In(productIds),
        userId: sellerId 
      }
    });

    if (products.length !== productIds.length) {
      throw new UnauthorizedException('Some products do not belong to this seller');
    }

    // Update products
    await this.productRepository.update(
      { 
        id: In(productIds),
        userId: sellerId 
      },
      updateData
    );

    return {
      message: `Successfully updated ${products.length} products`,
      updatedProducts: products.length
    };
  }

  // Add multiple images to a product
  async addProductImages(productId: number, sellerId: number, imageData: Array<{ imageUrl: string, altText?: string, sortOrder?: number }>) {
    const product = await this.productRepository.findOne({
      where: { id: productId, userId: sellerId },
      relations: ['images']
    });

    if (!product) {
      throw new NotFoundException('Product not found or does not belong to this seller');
    }

    const nextSortOrder = product.images.length;
    
    const newImages = imageData.map((imgData, index) => 
      this.productImageRepository.create({
        ...imgData,
        productId: productId,
        sortOrder: imgData.sortOrder ?? nextSortOrder + index,
        isActive: true
      })
    );

    const savedImages = await this.productImageRepository.save(newImages);

    return {
      message: `Added ${savedImages.length} images to product`,
      productId,
      addedImages: savedImages
    };
  }

  // Update product image order
  async updateImageOrder(productId: number, sellerId: number, imageOrderData: Array<{ imageId: number, sortOrder: number }>) {
    const product = await this.productRepository.findOne({
      where: { id: productId, userId: sellerId },
      relations: ['images']
    });

    if (!product) {
      throw new NotFoundException('Product not found or does not belong to this seller');
    }

    for (const orderData of imageOrderData) {
      await this.productImageRepository.update(
        { 
          id: orderData.imageId,
          productId: productId 
        },
        { sortOrder: orderData.sortOrder }
      );
    }

    return {
      message: 'Image order updated successfully',
      productId,
      updatedImages: imageOrderData.length
    };
  }

  // Delete product image
  async deleteProductImage(productId: number, imageId: number, sellerId: number) {
    const product = await this.productRepository.findOne({
      where: { id: productId, userId: sellerId }
    });

    if (!product) {
      throw new NotFoundException('Product not found or does not belong to this seller');
    }

    const image = await this.productImageRepository.findOne({
      where: { id: imageId, productId: productId }
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    await this.productImageRepository.remove(image);

    return {
      message: 'Image deleted successfully',
      deletedImageId: imageId
    };
  }

  // Get product categories with counts (for seller dashboard)
  async getSellerProductCategories(sellerId: number) {
    const categories = await this.productRepository
      .createQueryBuilder('product')
      .select('product.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(product.stockQuantity)', 'totalStock')
      .addSelect('AVG(product.price)', 'averagePrice')
      .where('product.userId = :sellerId', { sellerId })
      .groupBy('product.category')
      .orderBy('count', 'DESC')
      .getRawMany();

    return categories.map(cat => ({
      category: cat.category || 'Uncategorized',
      count: parseInt(cat.count),
      totalStock: parseInt(cat.totalStock) || 0,
      averagePrice: parseFloat(cat.averagePrice) || 0
    }));
  }

  // Update product stock with validation
  async updateProductStock(productId: number, sellerId: number, newStock: number) {
    if (newStock < 0) {
      throw new ConflictException('Stock quantity cannot be negative');
    }

    const product = await this.productRepository.findOne({
      where: { id: productId, userId: sellerId }
    });

    if (!product) {
      throw new NotFoundException('Product not found or does not belong to this seller');
    }

    const oldStock = product.stockQuantity || 0;
    product.stockQuantity = newStock;
    
    await this.productRepository.save(product);

    return {
      message: 'Stock updated successfully',
      productId,
      oldStock,
      newStock,
      difference: newStock - oldStock
    };
  }
}