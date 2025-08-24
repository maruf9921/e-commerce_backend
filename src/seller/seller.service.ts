import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Like } from 'typeorm';
import { User } from '../users/entities/unified-user.entity';
import { Role } from '../users/entities/role.enum';
import { SellerDto } from './dto/seller.dto';
import * as bcrypt from 'bcrypt';
import { Product } from '../product/entities/product.entity';
import { ProductDto } from 'src/product/dto/product.dto';
import { CreateProductDto } from 'src/product/dto/product.dto';

@Injectable()
export class SellerService {
  private readonly saltRounds = 8;

  constructor(
  @InjectRepository(User)
  private userRepository: Repository<User>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
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
      imageUrl: createProductDto.imageUrl,
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

}
