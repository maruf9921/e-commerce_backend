import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from './users/entities/unified-user.entity';
import { Product } from './product/entities/product.entity';
import { ProductImage } from './product/entities/image.entity';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { LoginLog } from './auth/entities/login-log.entity';

// Load environment variables
config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'e_commerce',
  entities: [User, Product, ProductImage, RefreshToken, LoginLog],
  migrations: ['src/migration/*.ts'],
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
});
