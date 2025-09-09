import { Injectable } from "@nestjs/common";
import { UsersService } from "../users/users.service";

@Injectable()
export class AdminService {
  constructor(private readonly usersService: UsersService) {}

  // Example method
  getAdminInfo(): string {
    return 'This will return admin information';
  }

  getAdminNameandId(name: string, id: number): object {
    return { name: name, id: id };
  }

  addAdmin(admindata: object): object {
    return admindata;
  }

  deleteAdmin(id: number): object {
    // delete the admin user by id
    return { message: `Admin with id ${id} deleted.` };
  }

  updateAdmin(id: number, updateData: any): object {
    return { message: `Admin with id ${id} updated.` };
  }

  patchAdmin(id: number, updateData: any): object {
    return { message: `Admin with id ${id} patched.` };
  }

  // Seller verification methods
  async getPendingSellers() {
    return await this.usersService.findPendingSellers();
  }

  async getVerifiedSellers() {
    return await this.usersService.findVerifiedSellers();
  }

  async verifySeller(sellerId: number) {
    return await this.usersService.verifySeller(sellerId);
  }

  async rejectSeller(sellerId: number, deleteAccount: boolean = false) {
    return await this.usersService.rejectSeller(sellerId, deleteAccount);
  }
}