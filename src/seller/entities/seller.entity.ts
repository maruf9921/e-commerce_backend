import { Product } from '../../product/entities/product.entity';
import { Entity, PrimaryColumn, Column, BeforeInsert, BeforeUpdate, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Entity('sellers')
export class Seller {
  @PrimaryColumn({
    type: 'varchar',
    length: 50,
  })
  id: string;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
  })
  username: string;

  @Column({
    type: 'varchar',
    length: 150,
  })
  fullName: string;

  @Column({
    type: 'boolean',
    default: false,
  })
  isActive: boolean;

  // Additional fields from your existing seller structure
  @Column({
    type: 'varchar',
    length: 255,
  })
  password: string;

  @Column({
    type: 'varchar',
    length: 15,
  })
  phone: string;

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

  @BeforeInsert()
  generateId(): void {
    // Custom ID generation logic for sellers
    const timestamp = Date.now().toString();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const prefix = 'SELLER';
    this.id = `${prefix}_${timestamp}_${randomNum}`;
  }

  
  @OneToMany(() => Product, (product) => product.seller, { 
    cascade: ['insert', 'update'],
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: false,
    orphanedRowAction: 'delete'
  })
  products: Product[];
}
