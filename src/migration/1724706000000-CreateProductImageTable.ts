import { MigrationInterface, QueryRunner, Table, ForeignKey, TableColumn } from 'typeorm';

export class CreateProductImageTable1724706000000 implements MigrationInterface {
    name = 'CreateProductImageTable1724706000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create product_images table
        await queryRunner.createTable(
            new Table({
                name: 'product_images',
                columns: [
                    {
                        name: 'id',
                        type: 'serial',
                        isPrimary: true,
                    },
                    {
                        name: 'imageUrl',
                        type: 'varchar',
                        length: '500',
                    },
                    {
                        name: 'altText',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'isActive',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'sortOrder',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'productId',
                        type: 'int',
                    },
                ],
            }),
            true,
        );

        // Create foreign key relationship
        await queryRunner.query(`
            ALTER TABLE "product_images" 
            ADD CONSTRAINT "FK_product_images_productId" 
            FOREIGN KEY ("productId") 
            REFERENCES "products"("id") 
            ON DELETE CASCADE 
            ON UPDATE CASCADE
        `);

        // Remove imageUrl column from products table if it exists
        const table = await queryRunner.getTable('products');
        const imageUrlColumn = table?.findColumnByName('imageUrl');
        if (imageUrlColumn) {
            await queryRunner.dropColumn('products', 'imageUrl');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Add imageUrl column back to products table
        await queryRunner.addColumn('products', new TableColumn({
            name: 'imageUrl',
            type: 'varchar',
            isNullable: true,
        }));

        // Drop product_images table
        await queryRunner.dropTable('product_images');
    }
}
