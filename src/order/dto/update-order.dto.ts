import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../entities/order.enums';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;
}