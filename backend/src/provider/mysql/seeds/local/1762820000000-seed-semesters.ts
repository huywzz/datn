import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedSemesters1762820000000 implements MigrationInterface {
    name = 'SeedSemesters1762820000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 2024-2025 semester 1: start 2024-08-01, end 2025-01-10
        await queryRunner.query(
            `INSERT INTO \`semesters\` (\`start_date\`, \`end_date\`, \`status\`) VALUES ('2024-08-01 00:00:00', '2025-01-10 00:00:00', 'active')`
        );

        // 2025 semester 2: start 2025-01-12, end 2025-06-12
        await queryRunner.query(
            `INSERT INTO \`semesters\` (\`start_date\`, \`end_date\`, \`status\`) VALUES ('2025-01-12 00:00:00', '2025-06-12 00:00:00', 'active')`
        );

        // 2025-2026 semester 1: start 2025-08-01, end 2026-01-10
        await queryRunner.query(
            `INSERT INTO \`semesters\` (\`start_date\`, \`end_date\`, \`status\`) VALUES ('2025-08-01 00:00:00', '2026-01-10 00:00:00', 'active')`
        );

        // 2025-2026 semester 2: start 2025-08-01, end 2026-01-10
        await queryRunner.query(
            `INSERT INTO \`semesters\` (\`start_date\`, \`end_date\`, \`status\`) VALUES ('2026-01-12 00:00:00', '2026-06-10 00:00:00', 'active')`
        );

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DELETE FROM \`semesters\` WHERE (\`start_date\`, \`end_date\`) IN 
            (('2024-08-01 00:00:00','2025-01-10 00:00:00'),
             ('2025-01-12 00:00:00','2025-06-12 00:00:00'),
             ('2025-08-01 00:00:00','2026-01-10 00:00:00'))`
        );
    }
}


