import { IsNotEmpty, IsPositive, IsString, MaxLength, IsOptional, IsBoolean, Min, ValidateNested, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { CreateProductImageDto } from './image.dto';

export class ProductDto {
    @IsString()
    @IsNotEmpty({ message: 'User ID is required' })
    userId: string;

    @IsString()
    @IsNotEmpty({ message: 'Product name is required' })
    @MaxLength(80, { message: 'Product name must not exceed 80 characters' })
    name: string;

    @IsString()
    @IsNotEmpty({ message: 'Description is required' })
    @MaxLength(1200, { message: 'Description must not exceed 1200 characters' })
    description: string;

    @IsNotEmpty({ message: 'Price is required' })
    @IsPositive({ message: 'Price must be a positive number' })
    @Min(0.01, { message: 'Price must be at least 0.01' })
    price: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateProductImageDto)
    images?: CreateProductImageDto[];
}

// NEW: DTO for creating products without userId (extracted from JWT)
export class CreateProductDto {
    @IsString()
    @IsNotEmpty({ message: 'Product name is required' })
    @MaxLength(80, { message: 'Product name must not exceed 80 characters' })
    name: string;

    @IsString()
    @IsNotEmpty({ message: 'Description is required' })
    @MaxLength(1200, { message: 'Description must not exceed 1200 characters' })
    description: string;

    @Transform(({ value }) => {
        if (typeof value === 'string') {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? 0 : parsed;
        }
        return value || 0;
    })
    @IsNotEmpty({ message: 'Price is required' })
    @IsPositive({ message: 'Price must be a positive number' })
    @Min(0.01, { message: 'Price must be at least 0.01' })
    price: number;

    @Transform(({ value }) => {
        if (typeof value === 'string') {
            const parsed = parseInt(value);
            return isNaN(parsed) ? 0 : parsed;
        }
        return value || 0;
    })
    @IsOptional()
    @IsPositive({ message: 'Stock quantity must be a positive number' })
    @Min(0, { message: 'Stock quantity must be at least 0' })
    stockQuantity?: number;

    @IsOptional()
    @IsString()
    @MaxLength(50, { message: 'Category must not exceed 50 characters' })
    category?: string;

    @Transform(({ value }) => {
        console.log('🔄 Transform isActive input:', value, typeof value);
        if (typeof value === 'string') {
            const result = value === 'true' || value === '1' || value.toLowerCase() === 'true';
            console.log('🔄 Transform isActive result:', result);
            return result;
        }
        if (typeof value === 'boolean') {
            return value;
        }
        // Default to true if undefined or null
        return value != null ? Boolean(value) : true;
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateProductImageDto)
    images?: CreateProductImageDto[];
}

export class UpdateProductDto {
    @IsOptional()
    @IsString()
    @MaxLength(80, { message: 'Product name must not exceed 80 characters' })
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1200, { message: 'Description must not exceed 1200 characters' })
    description?: string;

    @IsOptional()
    @IsPositive({ message: 'Price must be a positive number' })
    @Min(0.01, { message: 'Price must be at least 0.01' })
    price?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsString()
    imageUrl?: string;

    // Additional fields for frontend compatibility
    @IsOptional()
    @Min(0, { message: 'Stock must be a non-negative number' })
    stock?: number;

    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'Category must not exceed 100 characters' })
    category?: string;
}