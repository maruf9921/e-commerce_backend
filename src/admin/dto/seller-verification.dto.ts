import { IsOptional, IsBoolean } from 'class-validator';

export class VerifySellerDto {
  @IsOptional()
  @IsBoolean()
  notify?: boolean; // Whether to send notification email (future feature)
}

export class RejectSellerDto {
  @IsOptional()
  @IsBoolean()
  deleteAccount?: boolean = false; // Whether to delete account or just deactivate

  @IsOptional()
  reason?: string; // Reason for rejection (optional)
}
