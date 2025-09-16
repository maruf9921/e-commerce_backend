import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../product/entities/product.entity';
import { User } from '../../users/entities/unified-user.entity';
import { FinancialRecord } from './financial-record.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  // Foreign keys
  @Column({ type: 'int' })
  orderId: number;

  @Column({ type: 'int' })
  productId: number;

  @Column({ type: 'int' })
  sellerId: number;

  // Product data snapshot (for historical accuracy)
  @Column({ type: 'varchar', length: 255 })
  productNameSnapshot: string;

  @Column({ type: 'text', nullable: true })
  productDescriptionSnapshot?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPriceSnapshot: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  categorySnapshot?: string;

  // Order item specific data
  @Column({ type: 'int' })
  quantity: number;

  @Column('decimal', { precision: 12, scale: 2 })
  subtotal: number;

  // Item notes/instructions
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => Order, (order) => order.orderItems, {
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @OneToOne(() => FinancialRecord, (financialRecord) => financialRecord.orderItem, {
    cascade: true
  })
  financialRecord: FinancialRecord;

  // Helper methods
  static createFromProduct(product: Product, quantity: number): Partial<OrderItem> {
    const subtotal = product.price * quantity;
    
    return {
      productId: product.id,
      sellerId: product.userId,
      productNameSnapshot: product.name,
      productDescriptionSnapshot: product.description,
      unitPriceSnapshot: product.price,
      categorySnapshot: product.category,
      quantity,
      subtotal
    };
  }
}