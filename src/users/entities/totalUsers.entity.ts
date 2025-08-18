import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn,  } from "typeorm";
import { Role } from "./role.enum";

@Entity('total_users')
export class TotalUsers {
    @PrimaryGeneratedColumn()
    id: number;

   
    @Column({
    type: 'varchar',
    length: 100,
    unique: true,
  })
  username: string;

    @Column({
        type: 'varchar',
        length: 255,

    })
    password: string;

    @Column({
        type: 'varchar',
        length:255,
        unique: true,
    })
    email: string;

    @Column({
        type: 'varchar',
        length: 15,
    })
    phone: string;

    @Column({
        type: 'enum',
        enum: Role,
        default: Role.USER,
    })
    role: Role;

    @Column({ default: true })
    isActive: boolean;

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

}
