import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('product_images')
export class ProductImage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 500 })
    imageUrl: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    altText?: string;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @Column({ type: 'int', default: 0 })
    sortOrder: number; // For ordering multiple images

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    // Foreign key for product
    @Column({ type: 'int', name: 'productId', nullable: false })
    productId: number;

    // MANY-TO-ONE: Many images belong to one product
    @ManyToOne(() => Product, (product) => product.images, {
        nullable: false,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn({ name: 'productId', referencedColumnName: 'id' })
    product: Product;
}
