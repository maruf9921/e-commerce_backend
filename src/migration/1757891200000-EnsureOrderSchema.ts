import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureOrderSchema1757891200000 implements MigrationInterface {
  name = 'EnsureOrderSchema1757891200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums if not exist
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status_enum') THEN
          CREATE TYPE "order_status_enum" AS ENUM(
            'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
          CREATE TYPE "payment_status_enum" AS ENUM(
            'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_status_enum') THEN
          CREATE TYPE "financial_status_enum" AS ENUM(
            'PENDING', 'CLEARED', 'PAID', 'CANCELLED'
          );
        END IF;
      END$$;
    `);

    // Create orders table
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'orders'
        ) THEN
          CREATE TABLE "orders" (
            "id" SERIAL PRIMARY KEY,
            "userId" INTEGER NOT NULL,
            "status" "order_status_enum" NOT NULL DEFAULT 'PENDING',
            "totalAmount" DECIMAL(12,2) NOT NULL,
            "shippingCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
            "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
            "shippingAddress" JSONB NOT NULL,
            "notes" TEXT,
            "metadata" JSONB,
            "placedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "FK_orders_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
          );
          CREATE INDEX "IDX_orders_userId" ON "orders" ("userId");
          CREATE INDEX "IDX_orders_status" ON "orders" ("status");
          CREATE INDEX "IDX_orders_placedAt" ON "orders" ("placedAt");
        END IF;
      END$$;
    `);

    // Create order_items table
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'order_items'
        ) THEN
          CREATE TABLE "order_items" (
            "id" SERIAL PRIMARY KEY,
            "orderId" INTEGER NOT NULL,
            "productId" INTEGER NOT NULL,
            "sellerId" INTEGER NOT NULL,
            "productNameSnapshot" VARCHAR(255) NOT NULL,
            "productDescriptionSnapshot" TEXT,
            "unitPriceSnapshot" DECIMAL(10,2) NOT NULL,
            "categorySnapshot" VARCHAR(100),
            "quantity" INTEGER NOT NULL,
            "subtotal" DECIMAL(12,2) NOT NULL,
            "notes" TEXT,
            "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "FK_order_items_orderId" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE,
            CONSTRAINT "FK_order_items_productId" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT,
            CONSTRAINT "FK_order_items_sellerId" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT
          );
          CREATE INDEX "IDX_order_items_orderId" ON "order_items" ("orderId");
          CREATE INDEX "IDX_order_items_productId" ON "order_items" ("productId");
          CREATE INDEX "IDX_order_items_sellerId" ON "order_items" ("sellerId");
        END IF;
      END$$;
    `);

    // Create payments table
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'payments'
        ) THEN
          CREATE TABLE "payments" (
            "id" SERIAL PRIMARY KEY,
            "orderId" INTEGER NOT NULL UNIQUE,
            "provider" VARCHAR(50) NOT NULL,
            "providerPaymentId" VARCHAR(255),
            "amount" DECIMAL(12,2) NOT NULL,
            "currency" VARCHAR(3) NOT NULL DEFAULT 'BDT',
            "status" "payment_status_enum" NOT NULL DEFAULT 'PENDING',
            "paymentMethod" JSONB,
            "transactionDetails" JSONB,
            "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "processedAt" TIMESTAMP,
            "failedAt" TIMESTAMP,
            CONSTRAINT "FK_payments_orderId" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE
          );
        END IF;
      END$$;
    `);

    // Create financial_records table
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'financial_records'
        ) THEN
          CREATE TABLE "financial_records" (
            "id" SERIAL PRIMARY KEY,
            "sellerId" INTEGER NOT NULL,
            "orderItemId" INTEGER NOT NULL UNIQUE,
            "amount" DECIMAL(12,2) NOT NULL,
            "platformFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
            "processingFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
            "netAmount" DECIMAL(12,2) NOT NULL,
            "status" "financial_status_enum" NOT NULL DEFAULT 'PENDING',
            "payoutId" VARCHAR(255),
            "payoutMethod" VARCHAR(255),
            "payoutDetails" JSONB,
            "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "clearedAt" TIMESTAMP,
            "paidAt" TIMESTAMP,
            CONSTRAINT "FK_financial_records_sellerId" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT,
            CONSTRAINT "FK_financial_records_orderItemId" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE
          );
          CREATE INDEX "IDX_financial_records_sellerId" ON "financial_records" ("sellerId");
          CREATE INDEX "IDX_financial_records_status" ON "financial_records" ("status");
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // We won't drop tables here to avoid data loss; only provided as symmetry.
    // If needed, uncomment the following lines, but use with caution.
    // await queryRunner.query('DROP TABLE IF EXISTS "financial_records"');
    // await queryRunner.query('DROP TABLE IF EXISTS "payments"');
    // await queryRunner.query('DROP TABLE IF EXISTS "order_items"');
    // await queryRunner.query('DROP TABLE IF EXISTS "orders"');
    // await queryRunner.query('DROP TYPE IF EXISTS "financial_status_enum"');
    // await queryRunner.query('DROP TYPE IF EXISTS "payment_status_enum"');
    // await queryRunner.query('DROP TYPE IF EXISTS "order_status_enum"');
  }
}
