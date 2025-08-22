import { IsNotEmpty, IsPositive, IsString, MaxLength, IsOptional, IsBoolean, Min } from 'class-validator';

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
    @IsString()
    imageUrl?: string; 
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
}