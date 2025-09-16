import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Like, MoreThan, Between } from 'typeorm';
import { User } from '../users/entities/unified-user.entity';
import { Role } from '../users/entities/role.enum';
import { SellerDto } from './dto/seller.dto';
import * as bcrypt from 'bcrypt';
import { Product } from '../product/entities/product.entity';
import { ProductDto } from 'src/product/dto/product.dto';
import { CreateProductDto } from 'src/product/dto/product.dto';
import { Order } from '../order/entities/order.entity';
import { FinancialRecord } from '../order/entities/financial-record.entity';
import { OrderStatus, FinancialStatus } from '../order/entities/order.enums';

@Injectable()
export class SellerService {
  private readonly saltRounds = 8;

  constructor(
  @InjectRepository(User)
  private userRepository: Repository<User>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(FinancialRecord)
    private financialRecordRepository: Repository<FinancialRecord>,
  ) {}

  // Legacy method for backward compatibility
  getSellerInfo(): string {
    return 'Seller info';
  }

  // Create seller with entity
  async createSeller(sellerDto: SellerDto): Promise<User> {
    // Check if username already exists
    const existingUser = await this.userRepository.findOne({
      where: { username: sellerDto.username }
    });

    if (existingUser) {
      throw new ConflictException(`Username '${sellerDto.username}' already exists`);
    }

    const salt = await bcrypt.genSalt(8);
    const hashedPassword = await bcrypt.hash(sellerDto.password, salt);

    const seller = this.userRepository.create({
      username: sellerDto.username,
      fullName: sellerDto.fullName,
      password: hashedPassword,
      phone: sellerDto.phone,
      isActive: true, // Default to active for new sellers
      role: Role.SELLER
    });

    return await this.userRepository.save(seller);
  }

  // Search sellers by full name substring
  async getSellersByFullNameSubstring(substring: string): Promise<User[]> {
    return await this.userRepository.find({
      where: {
        fullName: Like(`%${substring}%`),
        role: Role.SELLER
      },
      order: {
        fullName: 'ASC'
      }
    });
  }

  // Get seller by username
  async getSellerByUsername(username: string): Promise<User> {
    const seller = await this.userRepository.findOne({
      where: { username, role: Role.SELLER }
    });

    if (!seller) {
      throw new NotFoundException(`Seller with username '${username}' not found`);
    }

    return seller;
  }

  // Remove seller by username
  async removeSellerByUsername(username: string): Promise<{ message: string; deletedSeller: User }> {
    const seller = await this.getSellerByUsername(username);
    
    await this.userRepository.remove(seller);
    
    return {
      message: `Seller with username '${username}' has been successfully deleted`,
      deletedSeller: seller
    };
  }

  // Get all sellers
  async getAllSellers(): Promise<User[]> {
    return await this.userRepository.find({
      where: { role: Role.SELLER },
      order: {
        fullName: 'ASC'
      }
    });
  }

  // Legacy methods for backward compatibility
  async getInfo(): Promise<User[]> {
    return await this.getAllSellers();
  }

  async getInfoById(id: string): Promise<User> {
    const seller = await this.userRepository.findOne({
      where: { id: Number(id), role: Role.SELLER }
    });

    if (!seller) {
      throw new NotFoundException(`Seller with ID '${id}' not found`);
    }

    return seller;
  }

  // Legacy add method
  async addSeller(sellerDto: SellerDto): Promise<User> {
    return await this.createSeller(sellerDto);
  }

  // Update seller
    async updateUser(id: string, sellerDto: SellerDto): Promise<User> {
      const seller = await this.userRepository.findOne({ where: { id: Number(id), role: Role.SELLER } });
    
      if (!seller) {
        throw new NotFoundException(`Seller with ID '${id}' not found`);
      }

      const updateData: any = {
        fullName: sellerDto.fullName,
        phone: sellerDto.phone,
        isActive: sellerDto.isActive
      };

      if (sellerDto.password) {
        updateData.password = await bcrypt.hash(sellerDto.password, this.saltRounds);
      }

      Object.assign(seller, updateData);
    
      const updatedSeller = await this.userRepository.save(seller);
    
      // Return without password
      const { password: _, ...sellerWithoutPassword } = updatedSeller;
      return sellerWithoutPassword as User;
    }

  // Delete seller
  async deleteUser(id: string): Promise<boolean> {
    const result = await this.userRepository.delete({ id: Number(id), role: Role.SELLER });
    return result.affected > 0;
  }
  
  // Update partial seller
  async updatePartialUser(id: string, sellerDto: Partial<SellerDto>): Promise<User> {
    const seller = await this.userRepository.findOne({ where: { id: Number(id), role: Role.SELLER } });
    
    if (!seller) {
      throw new NotFoundException(`Seller with ID '${id}' not found`);
    }

    //Hash password if it's being updated
    if (sellerDto.password) {
      sellerDto.password = await bcrypt.hash(sellerDto.password, this.saltRounds);
    }

    Object.assign(seller, sellerDto);
    
    const updatedSeller = await this.userRepository.save(seller);
    
    // Return without password
    const { password: _, ...sellerWithoutPassword } = updatedSeller;
    return sellerWithoutPassword as User;
  }

  // Search sellers by substring in full name
   async searchSellers(substring: string): Promise<User[]> {
    return await this.userRepository.find({
      where: {
        fullName: Like(`%${substring}%`),
        role: Role.SELLER
      },
      order: {
        fullName: 'ASC'
      }
    });
  }

  async getAllid(): Promise<User[]> {
    return await this.userRepository.find({
      where: { role: Role.SELLER },
      select: ['id'], // Only select the id field
      order: {
        createdAt: 'DESC' // Order by creation date if needed
      }
    });
  }

  async getAllUsernames(): Promise<User[]> {
    return await this.userRepository.find({
      where: { role: Role.SELLER },
      select: ['username'], // Only select the username field
    });
  }


  //simple login method and check hashpassword and plain password

  //SIMPLE VERSION: Just return seller without password

async loginSeller(username: string, password: string): Promise<{ message: string; seller: User }> {
  // Get seller with password (need full entity for password comparison)
  const seller = await this.userRepository.findOne({
    where: { username, role: Role.SELLER }
    // Include password for authentication
  });

  if (!seller) {
    throw new UnauthorizedException('Invalid username or password');
  }

  // Check if account is active
  if (!seller.isActive) {
    throw new UnauthorizedException('Account is inactive. Please contact administrator.');
  }

  // Check if the provided password matches the stored hashed password
  const isPasswordValid = await bcrypt.compare(password, seller.password);
  
  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid username or password');
  }

  // Return seller without password for security
  const { password: _, ...sellerWithoutPassword } = seller;
  
  return {
    message: 'Login successful',
    seller: sellerWithoutPassword as User
  };
}

  // One-to-Many Relationship Methods
  
  // Get seller with their products
  async getSellerWithProducts(sellerId: string): Promise<User> {
    const seller = await this.userRepository.findOne({
      where: { id: Number(sellerId), role: Role.SELLER },
      relations: ['products']
    });

    if (!seller) {
      throw new NotFoundException(`Seller with ID ${sellerId} not found`);
    }

    return seller;
  }

  // Get all sellers with their product count// password excluded for security
  async getAllSellersWithProductCount(): Promise<any[]> {
    const sellersWithProductCount = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.products', 'product')
      .where('user.role = :role', { role: Role.SELLER })
      .select([
        'user.id',
        'user.username',
        'user.fullName',
        'user.phone',
        'user.isActive',
        'COUNT(product.id) as productCount'
      ])
      .groupBy('user.id, user.username, user.fullName, user.phone, user.isActive')
      .getRawMany();

    return sellersWithProductCount;
  }

  // Get active products for a specific seller
  async getActiveProductsBySeller(sellerId: string): Promise<Product[]> {
    const seller = await this.userRepository.findOne({
      where: { id: Number(sellerId), role: Role.SELLER }
    });

    if (!seller) {
      throw new NotFoundException(`Seller with ID ${sellerId} not found`);
    }

    return await this.productRepository.find({
      where: { 
        seller: seller,
        isActive: true 
      }
    });
  }

  // Create product for a seller - FIXED: Uses CreateProductDto (no userId needed)
  async createProductForSeller(sellerId: string, createProductDto: CreateProductDto): Promise<Product> {
    const seller = await this.userRepository.findOne({
      where: { id: Number(sellerId), role: Role.SELLER }
    });

    if (!seller) {
      throw new NotFoundException(`Seller with ID ${sellerId} not found`);
    }

    if (!seller.isActive) {
      throw new UnauthorizedException('Only active sellers can create products');
    }

    const product = this.productRepository.create({
      name: createProductDto.name,
      description: createProductDto.description,
      price: createProductDto.price,
      isActive: createProductDto.isActive ?? true,
      seller: seller,
      userId: seller.id,
    });

    return await this.productRepository.save(product);
  }

  // Get seller's product statistics
  async getSellerProductStats(sellerId: string): Promise<any> {
    const seller = await this.userRepository.findOne({
      where: { id: Number(sellerId), role: Role.SELLER }
    });

    if (!seller) {
      throw new NotFoundException(`Seller with ID ${sellerId} not found`);
    }

    const totalProducts = await this.productRepository.count({
      where: { seller: seller }
    });

    const activeProducts = await this.productRepository.count({
      where: { seller: seller, isActive: true }
    });

    const inactiveProducts = totalProducts - activeProducts;

    return {
      seller: {
        id: seller.id,
        username: seller.username,
        fullName: seller.fullName
      },
      productStats: {
        totalProducts,
        activeProducts,
        inactiveProducts
      }
    };
  }

  async getSellerById(sellerId: string): Promise<User> {
    const seller = await this.userRepository.findOne({
      where: { id: Number(sellerId), role: Role.SELLER }
    });

    if (!seller) {
      throw new NotFoundException(`Seller with ID ${sellerId} not found`);
    }

    return seller;
  }
   
  
  async getSellerProductsNameAndDescription(sellerId: string): Promise<any> {
    const seller = await this.userRepository.findOne({
      where: { id: Number(sellerId), role: Role.SELLER },
      relations: ['products']
    });

    if (!seller) {
      throw new NotFoundException(`Seller with ID ${sellerId} not found`);
    }

    return {
      products: seller.products.map(product => ({
        name: product.name,
        description: product.description
      }))
    };
  }

  // ======= SELLER DASHBOARD ENHANCED METHODS =======

  // Get comprehensive seller dashboard data
  async getSellerDashboard(sellerId: number) {
    const seller = await this.userRepository.findOne({
      where: { id: sellerId, role: Role.SELLER }
    });

    if (!seller) {
      throw new NotFoundException(`Seller with ID ${sellerId} not found`);
    }

    // Get product analytics
    const productAnalytics = await this.getSellerProductAnalytics(sellerId);
    
    // Get order analytics
    const orderAnalytics = await this.getSellerOrderAnalytics(sellerId);
    
    // Get financial analytics
    const financialAnalytics = await this.getSellerFinancialAnalytics(sellerId);
    
    // Get recent orders
    const recentOrders = await this.getSellerRecentOrders(sellerId, 10);

    return {
      seller: {
        id: seller.id,
        username: seller.username,
        fullName: seller.fullName,
        phone: seller.phone,
        isActive: seller.isActive,
        joinedAt: seller.createdAt
      },
      analytics: {
        products: productAnalytics,
        orders: orderAnalytics,
        financial: financialAnalytics
      },
      recentOrders
    };
  }

  // Get seller product analytics
  private async getSellerProductAnalytics(sellerId: number) {
    const products = await this.productRepository.find({
      where: { userId: sellerId },
      relations: ['images']
    });

    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.isActive).length;
    const inactiveProducts = totalProducts - activeProducts;
    const totalStock = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);
    const lowStockProducts = products.filter(p => (p.stockQuantity || 0) < 10).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * (p.stockQuantity || 0)), 0);

    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
      lowStockProducts,
      totalStock,
      totalValue,
      averagePrice: totalProducts > 0 ? products.reduce((sum, p) => sum + p.price, 0) / totalProducts : 0,
      productsWithImages: products.filter(p => p.images && p.images.length > 0).length
    };
  }

  // Get seller order analytics
  private async getSellerOrderAnalytics(sellerId: number) {
    // Get orders that contain products from this seller
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItem')
      .leftJoinAndSelect('orderItem.product', 'product')
      .where('product.userId = :sellerId', { sellerId })
      .getMany();

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING).length;
    const confirmedOrders = orders.filter(o => o.status === OrderStatus.CONFIRMED).length;
    const shippedOrders = orders.filter(o => o.status === OrderStatus.SHIPPED).length;
    const deliveredOrders = orders.filter(o => o.status === OrderStatus.DELIVERED).length;
    const cancelledOrders = orders.filter(o => o.status === OrderStatus.CANCELLED).length;

    // Calculate total revenue from delivered orders
    const totalRevenue = orders
      .filter(o => o.status === OrderStatus.DELIVERED)
      .reduce((sum, order) => {
        const sellerItems = order.orderItems.filter(item => item.sellerId === sellerId);
        return sum + sellerItems.reduce((itemSum, item) => itemSum + item.subtotal, 0);
      }, 0);

    return {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
    };
  }

  // Get seller financial analytics
  private async getSellerFinancialAnalytics(sellerId: number) {
    const financialRecords = await this.financialRecordRepository.find({
      where: { sellerId }
    });

    const totalEarnings = financialRecords.reduce((sum, record) => sum + record.amount, 0);
    const pendingPayouts = financialRecords.filter(r => r.status === FinancialStatus.PENDING).reduce((sum, r) => sum + r.amount, 0);
    const completedPayouts = financialRecords.filter(r => r.status === FinancialStatus.PAID).reduce((sum, r) => sum + r.amount, 0);
    const platformFees = financialRecords.reduce((sum, record) => sum + (record.platformFee || 0), 0);

    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const monthlyEarnings = financialRecords
      .filter(r => r.createdAt >= currentMonthStart)
      .reduce((sum, r) => sum + r.amount, 0);

    return {
      totalEarnings,
      pendingPayouts,
      completedPayouts,
      platformFees,
      netEarnings: totalEarnings - platformFees,
      monthlyEarnings,
      totalTransactions: financialRecords.length
    };
  }

  // Get seller recent orders
  async getSellerRecentOrders(sellerId: number, limit: number = 10) {
    return await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItem')
      .leftJoinAndSelect('orderItem.product', 'product')
      .leftJoinAndSelect('order.buyer', 'customer')
      .where('product.userId = :sellerId', { sellerId })
      .orderBy('order.placedAt', 'DESC')
      .take(limit)
      .getMany();
  }

  // Get seller orders with status filter
  async getSellerOrders(sellerId: number, status?: string, page: number = 1, limit: number = 20) {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItem')
      .leftJoinAndSelect('orderItem.product', 'product')
      .leftJoinAndSelect('order.buyer', 'customer')
      .where('product.userId = :sellerId', { sellerId });

    if (status) {
      query.andWhere('order.status = :status', { status: status.toUpperCase() });
    }

    const orders = await query
      .orderBy('order.placedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const total = await query.getCount();

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Update seller verification status (admin only)
  async updateSellerVerification(sellerId: number, isVerified: boolean, adminId: number) {
    const seller = await this.userRepository.findOne({
      where: { id: sellerId, role: Role.SELLER }
    });

    if (!seller) {
      throw new NotFoundException(`Seller with ID ${sellerId} not found`);
    }

    seller.isVerified = isVerified;
    await this.userRepository.save(seller);

    return {
      message: `Seller verification status updated to ${isVerified ? 'verified' : 'unverified'}`,
      seller: {
        id: seller.id,
        username: seller.username,
        isVerified: seller.isVerified
      }
    };
  }

  // Get seller financial records
  async getSellerFinancialRecords(sellerId: number, page: number = 1, limit: number = 20) {
    const [records, total] = await this.financialRecordRepository.findAndCount({
      where: { sellerId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });

    return {
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Generate seller performance report
  async generateSellerReport(sellerId: number, startDate?: Date, endDate?: Date) {
    const seller = await this.userRepository.findOne({
      where: { id: sellerId, role: Role.SELLER }
    });

    if (!seller) {
      throw new NotFoundException(`Seller with ID ${sellerId} not found`);
    }

    const dateFilter = startDate && endDate ? Between(startDate, endDate) : MoreThan(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // Last 30 days

    // Get products data
    const products = await this.productRepository.find({
      where: { userId: sellerId },
      relations: ['images']
    });

    // Get orders data
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItem')
      .leftJoinAndSelect('orderItem.product', 'product')
      .where('product.userId = :sellerId', { sellerId })
      .andWhere('order.placedAt >= :startDate', { startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) })
      .getMany();

    // Get financial records
    const financialRecords = await this.financialRecordRepository.find({
      where: { 
        sellerId,
        createdAt: dateFilter
      }
    });

    const totalRevenue = financialRecords.reduce((sum, record) => sum + record.amount, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      reportPeriod: {
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: endDate || new Date()
      },
      seller: {
        id: seller.id,
        username: seller.username,
        fullName: seller.fullName
      },
      summary: {
        totalProducts: products.length,
        activeProducts: products.filter(p => p.isActive).length,
        totalOrders,
        totalRevenue,
        avgOrderValue,
        totalTransactions: financialRecords.length
      },
      products: products.slice(0, 10), // Top 10 products
      recentOrders: orders.slice(0, 5), // Last 5 orders
      financialSummary: {
        totalEarnings: totalRevenue,
        platformFees: financialRecords.reduce((sum, r) => sum + (r.platformFee || 0), 0),
        netEarnings: totalRevenue - financialRecords.reduce((sum, r) => sum + (r.platformFee || 0), 0)
      }
    };
  }

}
