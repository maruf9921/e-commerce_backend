import { Injectable } from '@nestjs/common';

@Injectable()
export class SellerService {
  private sellers = [
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' }
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

  addUser(user: { id: number; name: string }): object {
    this.sellers.push(user);
    return user;
  }

  updateUser(id: number, name: string): object | undefined {
    const seller = this.sellers.find(s => s.id === id);
    if (seller) {
      seller.name = name;
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
