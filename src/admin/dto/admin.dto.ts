import { IsInt, Max, Min, IsNotEmpty, IsEmail } from 'class-validator';

export class AdminDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsInt()
  @Min(18)
  @Max(65)
  age: number;

  @IsNotEmpty()
  role: string;
}
