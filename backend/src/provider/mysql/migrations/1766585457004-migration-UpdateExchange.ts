import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationUpdateExchange1766585457004 implements MigrationInterface {
    name = 'MigrationUpdateExchange1766585457004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` DROP FOREIGN KEY \`FK_62dad235064bed1b5cba0912bd8\``);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` DROP FOREIGN KEY \`FK_69114788f28fd20f83b75f8f873\``);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` DROP FOREIGN KEY \`FK_bd49671f0c876d711047010d72f\``);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` DROP FOREIGN KEY \`FK_e6ca8b042eaf39a5134039efab1\``);
        await queryRunner.query(`CREATE TABLE \`exchange_transactions\` (\`transaction_id\` int NOT NULL AUTO_INCREMENT, \`student_id\` int NOT NULL, \`status\` varchar(255) NOT NULL DEFAULT 'pending', \`description\` varchar(255) NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`transaction_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` DROP COLUMN \`requester_id\``);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` DROP COLUMN \`from_section_id\``);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` DROP COLUMN \`desired_section_id\``);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` DROP COLUMN \`accepter_id\``);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` DROP COLUMN \`status\``);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` DROP COLUMN \`matched_at\``);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` DROP COLUMN \`accepted_at\``);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` DROP COLUMN \`completed_at\``);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` ADD \`transaction_id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` ADD \`section_id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` ADD \`action\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` ADD \`note\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`exchange_transactions\` ADD CONSTRAINT \`FK_50ed1df1d43915d348a901698bb\` FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`student_id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` ADD CONSTRAINT \`FK_2ca4cdb3a2c590a352f29ca6ccd\` FOREIGN KEY (\`transaction_id\`) REFERENCES \`exchange_transactions\`(\`transaction_id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` ADD CONSTRAINT \`FK_692a55ebff3c7982d5e7d5fd0e2\` FOREIGN KEY (\`section_id\`) REFERENCES \`course_sections\`(\`section_id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` DROP FOREIGN KEY \`FK_692a55ebff3c7982d5e7d5fd0e2\``);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` DROP FOREIGN KEY \`FK_2ca4cdb3a2c590a352f29ca6ccd\``);
        await queryRunner.query(`ALTER TABLE \`exchange_transactions\` DROP FOREIGN KEY \`FK_50ed1df1d43915d348a901698bb\``);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` DROP COLUMN \`note\``);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` DROP COLUMN \`action\``);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` DROP COLUMN \`section_id\``);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` DROP COLUMN \`transaction_id\``);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` ADD \`completed_at\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` ADD \`accepted_at\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` ADD \`matched_at\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` ADD \`status\` varchar(255) NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` ADD \`accepter_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` ADD \`desired_section_id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` ADD \`from_section_id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` ADD \`requester_id\` int NOT NULL`);
        await queryRunner.query(`DROP TABLE \`exchange_transactions\``);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` ADD CONSTRAINT \`FK_e6ca8b042eaf39a5134039efab1\` FOREIGN KEY (\`from_section_id\`) REFERENCES \`course_sections\`(\`section_id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` ADD CONSTRAINT \`FK_bd49671f0c876d711047010d72f\` FOREIGN KEY (\`requester_id\`) REFERENCES \`students\`(\`student_id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` ADD CONSTRAINT \`FK_69114788f28fd20f83b75f8f873\` FOREIGN KEY (\`accepter_id\`) REFERENCES \`students\`(\`student_id\`) ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` ADD CONSTRAINT \`FK_62dad235064bed1b5cba0912bd8\` FOREIGN KEY (\`desired_section_id\`) REFERENCES \`course_sections\`(\`section_id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

}
