import { Injectable } from '@nestjs/common';
import { SellerDto } from './dto/seller.dto';

@Injectable()
export class SellerService {
  private sellers = [
    { id: 1, name: 'John', password: 'password123', phone: '01712345678' },
    { id: 2, name: 'Jane', password: 'password456', phone: '01887654321' }
  ];

getSellerInfo(): string {
  return 'Seller info';
}

  getInfo(): object[] {
    return this.sellers;
  }

  getInfoById(id: number): object | undefined {
    return this.sellers.find(s => s.id === id);
  }

  addSeller(sellerDto: SellerDto): object {
    const newSeller = {
      id: Date.now(), // Generate a simple ID
      ...sellerDto
    };
    this.sellers.push(newSeller);
    return newSeller;
  }

  updateUser(id: number, sellerDto: SellerDto): object | undefined {
    const seller = this.sellers.find(s => s.id === id);
    if (seller) {
      seller.name = sellerDto.name;
      seller.password = sellerDto.password;
      seller.phone = sellerDto.phone;
    }
    return seller;
  }

  deleteUser(id: number): boolean {
    const index = this.sellers.findIndex(s => s.id === id);
    if (index > -1) {
      this.sellers.splice(index, 1);
      return true;
    }
    return false;
  }
}
