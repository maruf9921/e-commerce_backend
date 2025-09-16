import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength, IsOptional, IsEnum, IsIn } from "class-validator";
import { Role } from "../../../users/entities/role.enum";

export class RegisterDto {
  @IsNotEmpty({ message: 'Username is required' })
  @IsString({ message: 'Username must be a string' })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(100, { message: 'Username cannot exceed 100 characters' })
  username: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @Matches(/^[0-9+\-\s()]+$/, { message: 'Invalid phone number format' })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'Full name must be a string' })
  @MaxLength(150, { message: 'Full name cannot exceed 150 characters' })
  fullName?: string;

  @IsNotEmpty({ message: 'Role is required' })
  @IsIn(['USER', 'ADMIN', 'SELLER'], { message: 'Role must be one of: USER, ADMIN, SELLER' })
  role: string;
}
