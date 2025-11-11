import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedCohorts1762830029123 implements MigrationInterface {
    name = 'SeedCohorts1762830029123'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Seed one cohort record: K21
        const id = 'K21';
        const code = 'K21';
        const name = 'K21';
        // Using DD-MM-YYYY from request: 01-10-2021 -> 2021-10-01, 1-6-2025 -> 2025-06-01
        const startYear = '2021-10-01 00:00:00';
        const endYear = '2026-06-01 00:00:00';

        await queryRunner.query(
            `INSERT INTO \`cohorts\` (\`id\`, \`code\`, \`name\`, \`start_year\`, \`end_year\`) VALUES ('${id}', '${code}', '${name}', '${startYear}', '${endYear}')`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Delete seeded cohort K21
        await queryRunner.query(
            `DELETE FROM \`cohorts\` WHERE \`id\` = 'K21'`
        );
    }

}
