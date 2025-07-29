import { IsString, IsNotEmpty, IsEmail, IsNumber, Matches } from 'class-validator';

export class AdminDto {

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z ]+$/, {
    message: 'Name must only contain alphabets',
  })
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Matches(/^[\w.-]+@[\w.-]+\.xyz$/, {
    message: 'Email must be a valid .xyz address',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10,17}$/, {
    message: 'NID must be a valid number between 10 to 17 digits',
  })
  nid: string;
}