import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './admin.entity';
import { AdminDto } from './dto/admin.dto';
import { UpdateStatusDto } from './dto/update-status.dto';


@Injectable()
export class AdminService {

  
  constructor(
    @InjectRepository(Admin)
    private adminRepo: Repository<Admin>,
  ) {}

  createAdmin(dto: AdminDto) {
    const admin = this.adminRepo.create(dto);
    return this.adminRepo.save(admin);
  }

  async updateStatus(id: number, dto: UpdateStatusDto) {
    await this.adminRepo.update(id, { status: dto.status });
    return this.adminRepo.findOneBy({ id });
  }

  getInactiveAdmins() {
    return this.adminRepo.find({ where: { status: 'inactive' } });
  }

  // getAdminsOlderThan40() {
  //   return this.adminRepo.createQueryBuilder('admin')
  //     .where('admin.age > :age', { age: 40 })
  //     .getMany();
  // }

  getAdminsOlderThan(age: number) {
  return this.adminRepo
    .createQueryBuilder('admin')
    .where('admin.age > :age', { age })
    .getMany();
}



  // // Example method
  //   getAdminInfo(): string {
  //   return 'This will return admin information';
  //   }

  //   getAdminNameandId(name: string, id: number): object {
  //       return { name:name, id:id };
  //   }

    
  //   addAdmin(admindata: object): object {
  //       return admindata; 
  //   }

  //   deleteAdmin(id: number): object {
  // // delete the admin user by id
  // return { message: `Admin with id ${id} deleted.` };
  //   }

  //   updateAdmin(id: number, updateData: any): object {
    
  //   return { message: `Admin with id ${id} updated.` };
  // }

  // patchAdmin(id: number, updateData: any): object {
    
  //   return { message: `Admin with id ${id} patched.` };
  // }

}