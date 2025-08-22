import { DataSource } from 'typeorm';
import { User } from './src/users/entities/unified-user.entity';
import { Product } from './src/product/entities/product.entity';

export default new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'e_commerce',
    entities: [User, Product],
    migrations: ['src/migration/*.ts'],
    synchronize: false,
    logging: true,
});
