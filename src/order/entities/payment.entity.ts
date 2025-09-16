import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn
} from 'typeorm';
import { Order } from './order.entity';
import { PaymentStatus } from './order.enums';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  // Foreign key to Order
  @Column({ type: 'int', unique: true })
  orderId: number;

  // Payment provider (e.g., 'stripe', 'paypal', 'cod', 'bkash')
  @Column({ type: 'varchar', length: 50 })
  provider: string;

  // External payment ID from provider
  @Column({ type: 'varchar', length: 255, nullable: true })
  providerPaymentId?: string;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'BDT' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  status: PaymentStatus;

  // Payment method details as JSON
  @Column({ type: 'jsonb', nullable: true })
  paymentMethod?: {
    type: string; // 'card', 'mobile_banking', 'cod', etc.
    last4?: string; // for cards
    brand?: string; // 'visa', 'mastercard', 'bkash', etc.
    details?: Record<string, any>;
  };

  // Transaction details and metadata
  @Column({ type: 'jsonb', nullable: true })
  transactionDetails?: {
    gatewayResponse?: Record<string, any>;
    failureReason?: string;
    refundDetails?: Record<string, any>;
    processingFee?: number;
  };

  // Important timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  processedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  failedAt?: Date;

  // Relations
  @OneToOne(() => Order, (order) => order.payment, {
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  // Helper methods
  isSuccessful(): boolean {
    return this.status === PaymentStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this.status === PaymentStatus.FAILED;
  }

  isPending(): boolean {
    return this.status === PaymentStatus.PENDING || this.status === PaymentStatus.PROCESSING;
  }

  canBeRefunded(): boolean {
    return this.status === PaymentStatus.COMPLETED;
  }

  markAsProcessed(): void {
    this.status = PaymentStatus.COMPLETED;
    this.processedAt = new Date();
  }

  markAsFailed(reason?: string): void {
    this.status = PaymentStatus.FAILED;
    this.failedAt = new Date();
    
    if (reason) {
      this.transactionDetails = {
        ...this.transactionDetails,
        failureReason: reason
      };
    }
  }
}