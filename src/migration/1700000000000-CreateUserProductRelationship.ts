import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateUserProductRelationship1700000000000 implements MigrationInterface {
    name = 'CreateUserProductRelationship1700000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create users table
        await queryRunner.createTable(
            new Table({
                name: 'users',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'sellerId',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                        isUnique: true,
                    },
                    {
                        name: 'username',
                        type: 'varchar',
                        length: '100',
                        isUnique: true,
                    },
                    {
                        name: 'password',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'email',
                        type: 'varchar',
                        length: '255',
                        isUnique: true,
                    },
                    {
                        name: 'phone',
                        type: 'varchar',
                        length: '15',
                    },
                    {
                        name: 'fullName',
                        type: 'varchar',
                        length: '150',
                        isNullable: true,
                    },
                    {
                        name: 'role',
                        type: 'enum',
                        enum: ['USER', 'SELLER'],
                        default: "'USER'",
                    },
                    {
                        name: 'isActive',
                        type: 'boolean',
                        default: true,
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
                    },
                ],
            }),
            true,
        );

        // Create products table
        await queryRunner.createTable(
            new Table({
                name: 'products',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                    },
                    {
                        name: 'description',
                        type: 'text',
                    },
                    {
                        name: 'price',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                    },
                    {
                        name: 'isActive',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'imageUrl',
                        type: 'varchar',
                        isNullable: true,
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
                    },
                    {
                        name: 'userId',
                        type: 'int',
                        isNullable: false,
                    },
                ],
            }),
            true,
        );

        // Note: Indexes will be created automatically by TypeORM when needed
        // You can add custom indexes later if performance optimization is required

        // Create foreign key constraint
        await queryRunner.createForeignKey(
            'products',
            new TableForeignKey({
                columnNames: ['userId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key first
        const table = await queryRunner.getTable('products');
        const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('userId') !== -1);
        if (foreignKey) {
            await queryRunner.dropForeignKey('products', foreignKey);
        }

        // Drop tables
        await queryRunner.dropTable('products');
        await queryRunner.dropTable('users');
    }
}
