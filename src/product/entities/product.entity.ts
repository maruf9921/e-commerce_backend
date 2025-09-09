
import { User } from '../../users/entities/unified-user.entity';
import { ProductImage } from './image.entity';
import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    UpdateDateColumn, 
    ManyToOne, 
    JoinColumn,
    OneToMany
} from 'typeorm';

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

    @Column({ type: 'int', default: 0 })
    stockQuantity: number;

    @Column({ nullable: true })
    category?: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    slug?: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

    // Use userId as foreign key for seller
    @Column({ type: 'int', name: 'userId', nullable: false })
    userId: number;

    // ONE-TO-MANY: One product can have many images
    @OneToMany(() => ProductImage, (image) => image.product, {
        cascade: true,
        eager: false
    })
    images: ProductImage[];

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