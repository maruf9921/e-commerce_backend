import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateRefreshTokensTable1700000000004 implements MigrationInterface {
    name = 'CreateRefreshTokensTable1700000000004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "refresh_tokens",
                columns: [
                    {
                        name: "id",
                        type: "integer",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "token",
                        type: "text",
                    },
                    {
                        name: "userId",
                        type: "integer",
                    },
                    {
                        name: "expiresAt",
                        type: "timestamp",
                    },
                    {
                        name: "isRevoked",
                        type: "boolean",
                        default: false,
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                    {
                        name: "ipAddress",
                        type: "varchar",
                        length: "45",
                        isNullable: true,
                    },
                    {
                        name: "userAgent",
                        type: "text",
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        // Add foreign key constraint
        await queryRunner.createForeignKey(
            "refresh_tokens",
            new TableForeignKey({
                columnNames: ["userId"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE",
            })
        );

        // Add index for faster token lookups
        await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_token" ON "refresh_tokens" ("token")`);
        await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_userId" ON "refresh_tokens" ("userId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("refresh_tokens");
    }
}
