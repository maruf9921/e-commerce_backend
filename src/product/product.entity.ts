import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Admin } from 'src/admin/admin.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('decimal')
  price: number;

  @Column()
  stock: number;

  // Many products belong to one admin
  @ManyToOne(() => Admin, (admin) => admin.products, { onDelete: 'CASCADE' })
  admin: Admin;
}
