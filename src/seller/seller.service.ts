import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike ,Like} from 'typeorm';
import { Seller } from './entities/seller.entity';
import { SellerDto } from './dto/seller.dto';

@Injectable()
export class SellerService {
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

    const seller = this.sellerRepository.create({
      username: sellerDto.username,
      fullName: sellerDto.fullName,
      password: sellerDto.password,
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
      where: { username }
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
    const seller = await this.getInfoById(id);
    
    Object.assign(seller, {
      fullName: sellerDto.fullName,
      password: sellerDto.password,
      phone: sellerDto.phone,
      isActive: sellerDto.isActive
    });

    return await this.sellerRepository.save(seller);
  }

  // Delete seller
  async deleteUser(id: string): Promise<boolean> {
    const result = await this.sellerRepository.delete({ id });
    return result.affected > 0;
  }
  
  // Update partial seller
  async updatePartialUser(id: string, sellerDto: Partial<SellerDto>): Promise<Seller> {
    const seller = await this.getInfoById(id);
    Object.assign(seller, sellerDto);

     return await this.sellerRepository.save(seller);
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
}
