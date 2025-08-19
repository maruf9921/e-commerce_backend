import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './admin.entity';
import { AdminDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin) private repo: Repository<Admin>,
  ) {}

  async findAll() {
    return this.repo.find();
  }

  async findOne(id: number) {
    const admin = await this.repo.findOne({ where: { id } });
    if (!admin) throw new NotFoundException(`Admin ${id} not found`);
    return admin;
  }

  // async create(dto: AdminDto) {
  //   const admin = this.repo.create(dto);
  //   return this.repo.save(admin);
  // }

  async update(id: number, dto: AdminDto) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async updateStatus(id: number, status: 'active' | 'inactive') {
    await this.findOne(id);
    await this.repo.update(id, { status });
    return this.findOne(id);
  }

  async updateEmail(id: number, email: string) {
    await this.findOne(id);
    await this.repo.update(id, { email });
    return this.findOne(id);
  }

  async remove(id: number) {
    const admin = await this.findOne(id);
    return this.repo.remove(admin);
  }

  async findByAgeRange(min: number, max: number) {
    return this.repo
      .createQueryBuilder('admin')
      .where('admin.age BETWEEN :min AND :max', { min, max })
      .getMany();
  }
}
