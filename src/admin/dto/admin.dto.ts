import { IsString, IsNotEmpty, IsEmail, IsNumber } from 'class-validator';

export class AdminDto {

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNumber()
  @IsNotEmpty()
  nid: number;
}