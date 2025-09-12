import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateLoginLogsTable1700000000003 implements MigrationInterface {
    name = 'CreateLoginLogsTable1700000000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "login_logs",
                columns: [
                    {
                        name: "id",
                        type: "integer",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "userId",
                        type: "integer",
                        isNullable: true,
                    },
                    {
                        name: "email",
                        type: "varchar",
                        length: "255",
                    },
                    {
                        name: "role",
                        type: "varchar",
                        length: "50",
                    },
                    {
                        name: "success",
                        type: "boolean",
                    },
                    {
                        name: "errorMessage",
                        type: "text",
                        isNullable: true,
                    },
                    {
                        name: "ipAddress",
                        type: "inet",
                        isNullable: true,
                    },
                    {
                        name: "userAgent",
                        type: "text",
                        isNullable: true,
                    },
                    {
                        name: "timestamp",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                ],
            }),
            true,
        );

        // Add foreign key constraint
        await queryRunner.createForeignKey(
            "login_logs",
            new TableForeignKey({
                columnNames: ["userId"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE",
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("login_logs");
    }
}
