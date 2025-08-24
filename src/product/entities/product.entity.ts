
import { User } from '../../users/entities/unified-user.entity';
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

    // Use userId as foreign key for seller
    @Column({ type: 'int', name: 'userId', nullable: false })
    userId: number;

    //MANY-TO-ONE: Many products belong to one user (seller)
    @ManyToOne(() => User, (user) => user.products, {
        nullable: false,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        eager: false
    })
    @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
    seller: User;
}