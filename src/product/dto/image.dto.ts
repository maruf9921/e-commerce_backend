import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateProductImageDto {
    @IsString()
    imageUrl: string;

    @IsOptional()
    @IsString()
    altText?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsNumber()
    sortOrder?: number;
}

export class UpdateProductImageDto {
    @IsOptional()
    @IsString()
    imageUrl?: string;

    @IsOptional()
    @IsString()
    altText?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsNumber()
    sortOrder?: number;
}
