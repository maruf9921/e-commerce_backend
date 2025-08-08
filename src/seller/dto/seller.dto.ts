import { IsString, IsBoolean, IsOptional, MaxLength, MinLength, Matches, IsNotEmpty } from 'class-validator';
//import { Hash } from 'crypto';


export class SellerDto {
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(100, { message: 'Username cannot exceed 100 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, { 
    message: 'Username can only contain letters, numbers, and underscores' 
  })
  username: string;

  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters long' })
  @MaxLength(150, { message: 'Full name cannot exceed 150 characters' })
  @Matches(/^[a-zA-Z\s]+$/, { 
    message: 'Full name can only contain letters and spaces' 
  })
  fullName: string;

  // Legacy name field for backward compatibility
  //@IsNotEmpty()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9 ]+$/, {
    message: 'Name must not contain any special characters!',
  })
  @IsString()
  name: string;
    
  // Password validation
  @IsNotEmpty()
  @MinLength(10, {
    message: 'Password must be at least 10 characters long!',
  })
  @Matches(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter!',
  })
  @IsString()
  password: string;

  // Phone number validation
  @IsNotEmpty()
  @Matches(/^01\d+$/, {
    message: 'Phone number field must start with 01!',
  })
  @IsString()
  phone: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
