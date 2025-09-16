import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne
} from 'typeorm';
import { User } from '../../users/entities/unified-user.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from './payment.entity';
import { OrderStatus } from './order.enums';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  // Foreign key to User (buyer)
  @Column({ type: 'int', name: 'userId' })
  userId: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING
  })
  status: OrderStatus;

  @Column('decimal', { precision: 12, scale: 2 })
  totalAmount: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  shippingCost: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  taxAmount: number;

  // Shipping address as JSON
  @Column({ type: 'jsonb' })
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  // Order notes/instructions
  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Order metadata as JSON
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  placedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  buyer: User;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
    cascade: true,
    eager: true
  })
  orderItems: OrderItem[];

  @OneToOne(() => Payment, (payment) => payment.order, {
    cascade: true
  })
  payment: Payment;

  // Helper methods
  getItemsBySeller(sellerId: number): OrderItem[] {
    return this.orderItems.filter(item => item.sellerId === sellerId);
  }

  getSellerSubtotal(sellerId: number): number {
    return this.getItemsBySeller(sellerId)
      .reduce((total, item) => total + item.subtotal, 0);
  }
}