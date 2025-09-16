import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrderTables1703000000000 implements MigrationInterface {
  name = 'CreateOrderTables1703000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create orders table
    await queryRunner.query(`
      CREATE TYPE "order_status_enum" AS ENUM(
        'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "payment_status_enum" AS ENUM(
        'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "financial_status_enum" AS ENUM(
        'PENDING', 'CLEARED', 'PAID', 'CANCELLED'
      )
    `);

    await queryRunner.query(`
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
      )
    `);

    await queryRunner.query(`
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
      )
    `);

    await queryRunner.query(`
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
      )
    `);

    await queryRunner.query(`
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
      )
    `);

    // Create indexes for better performance
    await queryRunner.query(`CREATE INDEX "IDX_orders_userId" ON "orders" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_status" ON "orders" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_placedAt" ON "orders" ("placedAt")`);
    
    await queryRunner.query(`CREATE INDEX "IDX_order_items_orderId" ON "order_items" ("orderId")`);
    await queryRunner.query(`CREATE INDEX "IDX_order_items_productId" ON "order_items" ("productId")`);
    await queryRunner.query(`CREATE INDEX "IDX_order_items_sellerId" ON "order_items" ("sellerId")`);
    
    await queryRunner.query(`CREATE INDEX "IDX_financial_records_sellerId" ON "financial_records" ("sellerId")`);
    await queryRunner.query(`CREATE INDEX "IDX_financial_records_status" ON "financial_records" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_financial_records_status"`);
    await queryRunner.query(`DROP INDEX "IDX_financial_records_sellerId"`);
    await queryRunner.query(`DROP INDEX "IDX_order_items_sellerId"`);
    await queryRunner.query(`DROP INDEX "IDX_order_items_productId"`);
    await queryRunner.query(`DROP INDEX "IDX_order_items_orderId"`);
    await queryRunner.query(`DROP INDEX "IDX_orders_placedAt"`);
    await queryRunner.query(`DROP INDEX "IDX_orders_status"`);
    await queryRunner.query(`DROP INDEX "IDX_orders_userId"`);

    // Drop tables (in reverse order due to foreign key dependencies)
    await queryRunner.query(`DROP TABLE "financial_records"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(`DROP TABLE "orders"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "financial_status_enum"`);
    await queryRunner.query(`DROP TYPE "payment_status_enum"`);
    await queryRunner.query(`DROP TYPE "order_status_enum"`);
  }
}