import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne
} from 'typeorm';
import { User } from '../../users/entities/unified-user.entity';
import { OrderItem } from './order-item.entity';
import { FinancialStatus } from './order.enums';

@Entity('financial_records')
export class FinancialRecord {
  @PrimaryGeneratedColumn()
  id: number;

  // Foreign keys
  @Column({ type: 'int' })
  sellerId: number;

  @Column({ type: 'int', unique: true })
  orderItemId: number;

  // Financial details
  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  platformFee: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  processingFee: number;

  @Column('decimal', { precision: 12, scale: 2 })
  netAmount: number; // amount - platformFee - processingFee

  @Column({
    type: 'enum',
    enum: FinancialStatus,
    default: FinancialStatus.PENDING
  })
  status: FinancialStatus;

  // Payout tracking
  @Column({ type: 'varchar', length: 255, nullable: true })
  payoutId?: string; // External payout ID

  @Column({ type: 'varchar', length: 255, nullable: true })
  payoutMethod?: string; // 'bank_transfer', 'mobile_banking', etc.

  @Column({ type: 'jsonb', nullable: true })
  payoutDetails?: {
    bankAccount?: string;
    mobileNumber?: string;
    transactionId?: string;
    reference?: string;
  };

  // Important timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  clearedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt?: Date;

  // Relations
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @OneToOne(() => OrderItem, (orderItem) => orderItem.financialRecord, {
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'orderItemId' })
  orderItem: OrderItem;

  // Helper methods
  calculateNetAmount(): number {
    return this.amount - this.platformFee - this.processingFee;
  }

  markAsCleared(): void {
    this.status = FinancialStatus.CLEARED;
    this.clearedAt = new Date();
    this.netAmount = this.calculateNetAmount();
  }

  markAsPaid(payoutId?: string, payoutDetails?: any): void {
    this.status = FinancialStatus.PAID;
    this.paidAt = new Date();
    
    if (payoutId) {
      this.payoutId = payoutId;
    }
    
    if (payoutDetails) {
      this.payoutDetails = { ...this.payoutDetails, ...payoutDetails };
    }
  }

  isPending(): boolean {
    return this.status === FinancialStatus.PENDING;
  }

  isCleared(): boolean {
    return this.status === FinancialStatus.CLEARED;
  }

  isPaid(): boolean {
    return this.status === FinancialStatus.PAID;
  }

  static createFromOrderItem(orderItem: OrderItem, platformFeeRate = 0.05): Partial<FinancialRecord> {
    const amount = orderItem.subtotal;
    const platformFee = amount * platformFeeRate;
    const netAmount = amount - platformFee;

    return {
      sellerId: orderItem.sellerId,
      orderItemId: orderItem.id,
      amount,
      platformFee,
      processingFee: 0,
      netAmount,
      status: FinancialStatus.PENDING
    };
  }
}