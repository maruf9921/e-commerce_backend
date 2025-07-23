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

}