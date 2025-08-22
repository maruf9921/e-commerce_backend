import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixSellerIdNullable1700000000002 implements MigrationInterface {
    name = 'FixSellerIdNullable1700000000002';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Make sellerId column nullable
        await queryRunner.query(`
            ALTER TABLE users 
            ALTER COLUMN "sellerId" DROP NOT NULL;
        `);
        
        // Update existing users without sellerId to have NULL
        await queryRunner.query(`
            UPDATE users 
            SET "sellerId" = NULL 
            WHERE "sellerId" = '' OR "sellerId" IS NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert: Make sellerId column NOT NULL again
        await queryRunner.query(`
            ALTER TABLE users 
            ALTER COLUMN "sellerId" SET NOT NULL;
        `);
    }
}
