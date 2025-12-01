import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationCreatePeriod1764208906428 implements MigrationInterface {
    name = 'MigrationCreatePeriod1764208906428'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`course_registration_periods\` (\`id\` int NOT NULL AUTO_INCREMENT, \`start_time\` datetime NOT NULL, \`end_time\` datetime NOT NULL, \`status\` tinyint NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`registrations\` ADD \`deleted_at\` timestamp(6) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`registrations\` DROP COLUMN \`deleted_at\``);
        await queryRunner.query(`DROP TABLE \`course_registration_periods\``);
    }

}
