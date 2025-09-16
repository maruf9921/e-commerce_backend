import { IsNotEmpty, IsNumber, IsPositive, Min } from 'class-validator';

export class AddToCartDto {
  @IsNotEmpty()
  @IsNumber()
  productId: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity: number = 1;
}

export class UpdateCartDto {
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity: number;
}