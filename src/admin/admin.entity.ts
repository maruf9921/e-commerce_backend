import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Product } from '../product/product.entity';

@Entity()
export class Admin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  age: number;

  @Column({ default: 'admin' })
  role: string;

  @Column({ default: 'active' })
  status: string;


  // One admin can have many products
  @OneToMany(() => Product, (product) => product.admin)
  products: Product[];
}
