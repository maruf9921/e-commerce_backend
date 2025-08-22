import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// Update the import to match the actual exported member from unified-user.entity.ts
import { User } from './entities/unified-user.entity';
import { Role } from './entities/role.enum';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import { Product } from 'src/product/entities/product.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ) {}

  async getAllUsers(): Promise<Partial<User>[]> {
    const users = await this.userRepository.find({
      select: ['id', 'username', 'email', 'phone', 'role', 'isActive', 'createdAt', 'updatedAt']
    });
    return users;
  }

  async getUserById(id: number): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'username', 'email', 'phone', 'role', 'isActive', 'createdAt', 'updatedAt']
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async getUserByUsername(username: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { username },
      select: ['id', 'username', 'email', 'phone', 'role', 'isActive', 'createdAt', 'updatedAt']
    });

    if (!user) {
      throw new NotFoundException(`User with username '${username}' not found`);
    }

    return user;
  }

  async createUser(createUserDto: CreateUserDto): Promise<Partial<User>> {
    const { username, email, password, phone, role = Role.USER } = createUserDto;

    // Check if username exists
    const existingUsername = await this.userRepository.findOne({ where: { username } });
    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    // Check if email exists
    const existingEmail = await this.userRepository.findOne({ where: { email } });
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
      phone,
      role,
      isActive: true,
    });

    await this.userRepository.save(user);

    const { password: _, ...result } = user;
    return result;
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check for unique constraints if updating username or email
    if (updateUserDto.username) {
      const existingUsername = await this.userRepository.findOne({ 
        where: { username: updateUserDto.username } 
      });
      if (existingUsername && existingUsername.id !== id) {
        throw new ConflictException('Username already exists');
      }
    }

    if (updateUserDto.email) {
      const existingEmail = await this.userRepository.findOne({ 
        where: { email: updateUserDto.email } 
      });
      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictException('Email already exists');
      }
    }

    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);

    const { password, ...result } = user;
    return result;
  }

  async deleteUser(id: number): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userRepository.remove(user);
    return { message: `User '${user.username}' has been successfully deleted` };
  }

  async getUsersByRole(role: Role): Promise<Partial<User>[]> {
    const users = await this.userRepository.find({
      where: { role },
      select: ['id', 'username', 'email', 'phone', 'role', 'isActive', 'createdAt', 'updatedAt']
    });
    return users;
  }

  async getActiveUsers(): Promise<Partial<User>[]> {
    const users = await this.userRepository.find({
      where: { isActive: true },
      select: ['id', 'username', 'email', 'phone', 'role', 'isActive', 'createdAt', 'updatedAt']
    });
    return users;
  }

  async toggleUserStatus(id: number): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.isActive = !user.isActive;
    await this.userRepository.save(user);

    const { password, ...result } = user;
    return result;
  }
}
