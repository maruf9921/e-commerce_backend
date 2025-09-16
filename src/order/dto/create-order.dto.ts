import { IsNotEmpty, IsNumber, IsPositive, Min } from 'class-validator';

export class CreateOrderItemDto {
  @IsNotEmpty()
  @IsNumber()
  productId: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity: number;
}

export class ShippingAddressDto {
  @IsNotEmpty()
  fullName: string;

  @IsNotEmpty()
  phone: string;

  @IsNotEmpty()
  line1: string;

  line2?: string;

  @IsNotEmpty()
  city: string;

  @IsNotEmpty()
  state: string;

  @IsNotEmpty()
  postalCode: string;

  @IsNotEmpty()
  country: string;
}

export class CreateOrderFromCartDto {
  @IsNotEmpty()
  shippingAddress: ShippingAddressDto;

  notes?: string;
}

export class CreateOrderDto {
  @IsNotEmpty()
  items: CreateOrderItemDto[];

  @IsNotEmpty()
  shippingAddress: ShippingAddressDto;

  @IsNotEmpty()
  paymentMethod: string; // 'cod', 'card', 'mobile_banking', etc.

  notes?: string;
}