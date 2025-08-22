import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminRole1700000000001 implements MigrationInterface {
    name = 'AddAdminRole1700000000001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add ADMIN role to the existing enum
        await queryRunner.query(`
            ALTER TYPE users_role_enum ADD VALUE 'ADMIN';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Note: PostgreSQL doesn't support removing enum values directly
        // This would require recreating the enum type
        console.log('Warning: Cannot remove ADMIN role from enum in PostgreSQL');
    }
}
