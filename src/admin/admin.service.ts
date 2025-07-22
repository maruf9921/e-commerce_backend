import { Injectable } from "@nestjs/common";


@Injectable()
export class AdminService {

  // Example method
  getAdminInfo(): string {
    return 'This will return admin information';
  }

    getAdminNameandId(name: string, id: number): object {
        return { name:name, id:id };
    }

    addAdmin(admindata: object): object {
        return admindata; 
    }
}