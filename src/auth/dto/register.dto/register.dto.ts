import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength, IsOptional, IsEnum } from "class-validator";

enum Role {
  USER = 'user',
  ADMIN = 'admin',
  SELLER = 'seller'
}

export class RegisterDto {
     @IsString()
      @MinLength(3, { message: 'Username must be at least 3 characters long' })
      @MaxLength(100, { message: 'Username cannot exceed 100 characters' })
     
      username: string;


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

      @IsNotEmpty()
      @IsEmail({}, { message: 'Invalid email address' })
      email: string;

      @IsOptional()
      @IsEnum(Role, { message: 'Role must be one of: user, admin, seller' })
      role?: Role;

}
