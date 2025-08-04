import { IsInt, IsString, MaxLength, Min } from 'class-validator';

export class AdminDto {
  @IsString()
  @MaxLength(100)
  fullName: string;

  @IsInt()
  @Min(0)
  age: number;
}
