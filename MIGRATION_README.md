# Database Migration for User-Product Relationship

## Overview
This migration establishes the proper relationship between User and Product entities in your e-commerce backend.

## Current Issues Fixed
1. **Duplicate Relationships**: Removed conflicting relationships between Seller and Product entities
2. **Foreign Key Constraints**: Established proper foreign key relationship from Product to User
3. **Data Integrity**: Ensured CASCADE operations for data consistency

## Entity Relationship
```
User (1) ←→ (Many) Product
```
- One user (seller) can have many products
- Each product belongs to exactly one user (seller)
- Products are automatically deleted when their seller is deleted

## Running the Migration

### 1. Install TypeORM CLI (if not already installed)
```bash
npm install -g typeorm
```

### 2. Run the Migration
```bash
npm run migration:run
```

### 3. Verify Migration
Check your database to ensure:
- `users` table is created with proper structure
- `products` table is created with `userId` foreign key
- Foreign key constraints are properly established

## Migration Commands Available

- **Generate new migration**: `npm run migration:generate -- -n MigrationName`
- **Run migrations**: `npm run migration:run`
- **Revert last migration**: `npm run migration:revert`
- **Sync schema**: `npm run schema:sync`

## Database Schema

### Users Table
- `id` (Primary Key, Auto-increment)
- `sellerId` (Unique, nullable - for sellers only)
- `username` (Unique)
- `password`
- `email` (Unique)
- `phone`
- `fullName` (nullable)
- `role` (enum: USER/SELLER)
- `isActive`
- `createdAt`
- `updatedAt`

### Products Table
- `id` (Primary Key, Auto-increment)
- `name`
- `description`
- `price` (decimal 10,2)
- `isActive`
- `imageUrl` (nullable)
- `createdAt`
- `updatedAt`
- `userId` (Foreign Key → users.id)

## Important Notes

1. **Backup your database** before running migrations
2. **Test in development** environment first
3. **Ensure database connection** is properly configured
4. **Check entity relationships** in your code match the database schema

## Troubleshooting

If you encounter issues:
1. Check database connection settings in `ormconfig.ts`
2. Verify PostgreSQL is running and accessible
3. Ensure you have proper permissions on the database
4. Check migration logs for specific error messages
