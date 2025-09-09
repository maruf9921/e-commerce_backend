import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStockQuantityAndCategoryToProducts1724708000000 implements MigrationInterface {
    name = 'AddStockQuantityAndCategoryToProducts1724708000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "stockQuantity" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "products" ADD "category" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "category"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "stockQuantity"`);
    }
}
