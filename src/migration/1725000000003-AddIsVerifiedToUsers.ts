import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsVerifiedToUsers1725000000003 implements MigrationInterface {
    name = 'AddIsVerifiedToUsers1725000000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add isVerified column to users table
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "isVerified" boolean NOT NULL DEFAULT false
        `);

        // Set isVerified to true for existing non-seller users
        await queryRunner.query(`
            UPDATE "users" 
            SET "isVerified" = true 
            WHERE "role" != 'SELLER'
        `);

        // Set isVerified to false for existing sellers (they need to be re-verified)
        await queryRunner.query(`
            UPDATE "users" 
            SET "isVerified" = false 
            WHERE "role" = 'SELLER'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove isVerified column
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN "isVerified"
        `);
    }
}
