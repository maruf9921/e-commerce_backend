import { 
  IsString, 
  IsEmail, 
  IsNotEmpty, 
  IsOptional, 
  IsBoolean, 
  IsIn,
  MinLength, 
  MaxLength, 
  Matches 
} from 'class-validator';
import { Role } from '../entities/role.enum';

export class CreateUserDto {
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(100, { message: 'Username cannot exceed 100 characters' })
  username: string;

  @IsOptional()
  @IsString()
  @MaxLength(150, { message: 'Full name cannot exceed 150 characters' })
  fullName?: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @IsNotEmpty()
  @MinLength(10, {
    message: 'Password must be at least 10 characters long!',
  })
  @Matches(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter!',
  })
  @IsString()
  password: string;

  @IsNotEmpty()
  @Matches(/^01\d+$/, {
    message: 'Phone number field must start with 01!',
  })
  @IsString()
  phone: string;

  @IsOptional()
  @IsIn(['USER', 'ADMIN', 'SELLER'], { message: 'Role must be one of: USER, ADMIN, SELLER' })
  role?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(100, { message: 'Username cannot exceed 100 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, { 
    message: 'Username can only contain letters, numbers, and underscores' 
  })
  username?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address' })
  email?: string;

  @IsOptional()
  @Matches(/^01\d+$/, {
    message: 'Phone number field must start with 01!',
  })
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn(['USER', 'ADMIN', 'SELLER'], { message: 'Role must be one of: USER, ADMIN, SELLER' })
  role?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UserResponseDto {
  id: number;
  username: string;
  email: string;
  phone: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}