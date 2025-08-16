
import { Seller } from '../../seller/entities/seller.entity';
import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';


@Entity('products')
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ type: 'text' })
    description: string;

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    imageUrl?: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

    //sellerId is now properly NOT NULL
    @Column({ name: 'sellerId', nullable: false })
    sellerId: string;

    //MANY-TO-ONE: Many products belong to one seller
    @ManyToOne(() => Seller, (seller) => seller.products, {
        nullable: false,
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'sellerId' })
    seller: Seller;
}