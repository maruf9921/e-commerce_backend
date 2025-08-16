import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Like } from 'typeorm';
import { Seller } from './entities/seller.entity';
import { SellerDto } from './dto/seller.dto';
import * as bcrypt from 'bcrypt';
import { Product } from '../product/entities/product.entity';
import { ProductDto } from 'src/product/dto/product.dto';

@Injectable()
export class SellerService {
  private readonly saltRounds = 8;

  constructor(
    @InjectRepository(Seller)
    private sellerRepository: Repository<Seller>,
    
  ) {}

  // Legacy method for backward compatibility
  getSellerInfo(): string {
    return 'Seller info';
  }

  // Create seller with entity
  async createSeller(sellerDto: SellerDto): Promise<Seller> {
    // Check if username already exists
    const existingUser = await this.sellerRepository.findOne({
      where: { username: sellerDto.username }
    });

    if (existingUser) {
      throw new ConflictException(`Username '${sellerDto.username}' already exists`);
    }

    const salt = await bcrypt.genSalt(8);
    const hashedPassword = await bcrypt.hash(sellerDto.password, salt);
    //console.log('Hashed Password:', hashedPassword);

    const seller = this.sellerRepository.create({
      username: sellerDto.username,
      fullName: sellerDto.fullName,
      password: hashedPassword,
      phone: sellerDto.phone,
      isActive: sellerDto.isActive || false,
    });

    return await this.sellerRepository.save(seller);
  }

  // Search sellers by full name substring
  async getSellersByFullNameSubstring(substring: string): Promise<Seller[]> {
    return await this.sellerRepository.find({
      where: {
        fullName: Like(`%${substring}%`)
      },
      order: {
        fullName: 'ASC'
      }
    });
  }

  // Get seller by username
  async getSellerByUsername(username: string): Promise<Seller> {
    const seller = await this.sellerRepository.findOne({
      where: { username } // Use username directly for lookup
    });

    if (!seller) {
      throw new NotFoundException(`Seller with username '${username}' not found`);
    }

    return seller;
  }

  // Remove seller by username
  async removeSellerByUsername(username: string): Promise<{ message: string; deletedSeller: Seller }> {
    const seller = await this.getSellerByUsername(username);
    
    await this.sellerRepository.remove(seller);
    
    return {
      message: `Seller with username '${username}' has been successfully deleted`,
      deletedSeller: seller
    };
  }

  // Get all sellers
  async getAllSellers(): Promise<Seller[]> {
    return await this.sellerRepository.find({
      order: {
        fullName: 'ASC'
      }
    });
  }

  // Legacy methods for backward compatibility
  async getInfo(): Promise<Seller[]> {
    return await this.getAllSellers();
  }

  async getInfoById(id: string): Promise<Seller> {
    const seller = await this.sellerRepository.findOne({
      where: { id }
    });

    if (!seller) {
      throw new NotFoundException(`Seller with ID '${id}' not found`);
    }

    return seller;
  }

  // Legacy add method
  async addSeller(sellerDto: SellerDto): Promise<Seller> {
    return await this.createSeller(sellerDto);
  }

  // Update seller
    async updateUser(id: string, sellerDto: SellerDto): Promise<Seller> {
    const seller = await this.sellerRepository.findOne({ where: { id } });
    
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
    
    const updatedSeller = await this.sellerRepository.save(seller);
    
    // Return without password
    const { password: _, ...sellerWithoutPassword } = updatedSeller;
    return sellerWithoutPassword as Seller;
  }

  // Delete seller
  async deleteUser(id: string): Promise<boolean> {
    const result = await this.sellerRepository.delete({ id });
    return result.affected > 0;
  }
  
  // Update partial seller
  async updatePartialUser(id: string, sellerDto: Partial<SellerDto>): Promise<Seller> {
    const seller = await this.sellerRepository.findOne({ where: { id } });
    
    if (!seller) {
      throw new NotFoundException(`Seller with ID '${id}' not found`);
    }

    // ✅ Hash password if it's being updated
    if (sellerDto.password) {
      sellerDto.password = await bcrypt.hash(sellerDto.password, this.saltRounds);
    }

    Object.assign(seller, sellerDto);
    
    const updatedSeller = await this.sellerRepository.save(seller);
    
    // Return without password
    const { password: _, ...sellerWithoutPassword } = updatedSeller;
    return sellerWithoutPassword as Seller;
  }

  // Search sellers by substring in full name
   async searchSellers(substring: string): Promise<Seller[]> {
    return await this.sellerRepository.find({
      where: {
        fullName: Like(`%${substring}%`)
      },
      order: {
        fullName: 'ASC'
      }
    });
  }

  async getAllid(): Promise<Seller[]> {
    return await this.sellerRepository.find({
      select: ['id'], // Only select the id field
      order: {
        createdAt: 'DESC' // Order by creation date if needed
      }
    });
  }

  async getAllUsernames(): Promise<Seller[]>{
    return await this.sellerRepository.find({
      select: ['username'], // Only select the username field
    });
  }


  //simple login method and check hashpassword and plain password

  //SIMPLE VERSION: Just return seller without password

async loginSeller(username: string, password: string): Promise<{ message: string; seller: Seller }> {
  // Get seller with password (need full entity for password comparison)
  const seller = await this.sellerRepository.findOne({
    where: { username }
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
    seller: sellerWithoutPassword as Seller
  };
}


}
