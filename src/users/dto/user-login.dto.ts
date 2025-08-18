import { IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class UserLoginDto {
  @IsNotEmpty({ message: 'Username is required' })
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(100, { message: 'Username cannot exceed 100 characters' })
  
  username: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(10, {
    message: 'Password must be at least 10 characters long!',
  })
  @Matches(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter!',
  })
  @IsString()
  password: string;
}
