import { DataSource } from 'typeorm';
import { User } from './users/entities/unified-user.entity';
import { Product } from './product/entities/product.entity';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'e_commerce',
    entities: [User, Product],
    synchronize: false,
    migrations: ['src/migration/*.ts'],
    logging: true,
});

// Removed default export to ensure only one DataSource export for TypeORM CLI
