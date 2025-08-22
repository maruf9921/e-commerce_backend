import { Product } from '../../product/entities/product.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, BeforeInsert } from 'typeorm';
import { Role } from './role.enum';
import * as bcrypt from 'bcrypt';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    // Custom seller ID for sellers only
    @Column({
        type: 'varchar',
        length: 50,
        nullable: true, // Changed to true since not all users are sellers
        unique: true,
    })
    sellerId?: string;

    @Column({
        type: 'varchar',
        length: 100,
        unique: true,
    })
    username: string;

    @Column({
        type: 'varchar',
        length: 255,
    })
    password: string;

    @Column({
        type: 'varchar',
        length: 255,
        unique: true,
    })
    email: string;

    @Column({
        type: 'varchar',
        length: 15,
    })
    phone: string;

    // For sellers: full name, for users: can be display name
    @Column({
        type: 'varchar',
        length: 150,
        nullable: true,
    })
    fullName?: string;

    @Column({
        type: 'enum',
        enum: Role,
        default: Role.USER,
    })
    role: Role;

    @Column({ 
        type: 'boolean',
        default: true 
    })
    isActive: boolean;

    @CreateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    createdAt: Date;

    @UpdateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    updatedAt: Date;

    // One-to-Many: User (as seller) can have many products
    @OneToMany(() => Product, (product) => product.seller, {
        cascade: true,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        eager: false
    })
    products?: Product[];

    @BeforeInsert()
    generateSellerIdIfNeeded(): void {
        // Generate seller ID only for sellers
        if (this.role === Role.SELLER && !this.sellerId) {
            const timestamp = Date.now().toString();
            const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            this.sellerId = `SELLER_${timestamp}_${randomNum}`;
        }
        // For non-sellers, sellerId remains undefined (nullable)
    }

    // Helper method to check if user is a seller
    isSeller(): boolean {
        return this.role === Role.SELLER;
    }

    // Helper method to get seller identifier
    getSellerIdentifier(): string {
        return this.sellerId || this.id.toString();
    }
}
