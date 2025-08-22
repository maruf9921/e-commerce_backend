import { Injectable } from '@nestjs/common';

@Injectable()
export class CustomerService {
  private customers = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ];

  getCustomerInfo(): string {
    return 'Customer info';
  }

  getInfo(): object[] {
    return this.customers;
  }

  getInfoById(id: number): object | undefined {
    return this.customers.find((c) => c.id === id);
  }

  addUser(user: { id: number; name: string }): object {
    this.customers.push(user);
    return user;
  }

  updateUser(id: number, name: string): object | undefined {
    const customer = this.customers.find((c) => c.id === id);
    if (customer) {
      customer.name = name;
    }
    return customer;
  }

  deleteUser(id: number): boolean {
    const index = this.customers.findIndex((c) => c.id === id);
    if (index > -1) {
      this.customers.splice(index, 1);
      return true;
    }
    return false;
  }
  
}
