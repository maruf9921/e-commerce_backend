import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveBeforeHooks1700000000003 implements MigrationInterface {
    name = 'RemoveBeforeHooks1700000000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // This migration removes the BeforeInsert and BeforeUpdate hooks from the Product entity
        // The hooks are removed from the entity code, so no database changes are needed
        // However, we need to ensure that any existing data that was processed by these hooks
        // remains consistent
        
        // Check if there are any products with incomplete imageUrl or slug data
        const productsWithIncompleteData = await queryRunner.query(`
            SELECT id, name, "imageUrl", slug 
            FROM products 
            WHERE ("imageUrl" IS NULL OR slug IS NULL)
        `);
        
        if (productsWithIncompleteData.length > 0) {
            console.log(`Found ${productsWithIncompleteData.length} products with incomplete data that need manual review`);
        }
        
        // Log the migration completion
        console.log('BeforeInsert and BeforeUpdate hooks have been removed from Product entity');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Since we're removing hooks, the down migration would need to re-add them
        // However, this is typically not needed as removing hooks is usually a permanent change
        console.log('BeforeInsert and BeforeUpdate hooks removal cannot be reverted automatically');
    }
}
