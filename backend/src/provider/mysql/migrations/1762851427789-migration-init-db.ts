import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationInitDb1762851427789 implements MigrationInterface {
    name = 'MigrationInitDb1762851427789'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`cohorts\` (\`id\` varchar(255) NOT NULL, \`code\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`start_year\` datetime NOT NULL, \`end_year\` datetime NOT NULL, \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`courses\` (\`course_id\` int NOT NULL, \`code\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`credits\` int NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`course_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`instructors\` (\`instructor_id\` int NOT NULL AUTO_INCREMENT, \`full_name\` varchar(255) NOT NULL, \`department\` varchar(255) NOT NULL, \`title\` varchar(255) NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`instructor_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`class_schedules\` (\`schedule_id\` int NOT NULL AUTO_INCREMENT, \`section_id\` int NOT NULL, \`day_of_week\` varchar(255) NOT NULL, \`start_period\` int NOT NULL, \`end_period\` int NOT NULL, \`room\` varchar(255) NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`schedule_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`registrations\` (\`registration_id\` int NOT NULL AUTO_INCREMENT, \`student_id\` int NOT NULL, \`section_id\` int NOT NULL, \`registered_at\` datetime NOT NULL, \`status\` varchar(255) NOT NULL DEFAULT 'active', \`semester\` int NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`registration_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`exchange_requests\` (\`exchange_id\` int NOT NULL AUTO_INCREMENT, \`requester_id\` int NOT NULL, \`from_section_id\` int NOT NULL, \`desired_section_id\` int NOT NULL, \`accepter_id\` int NULL, \`status\` varchar(255) NOT NULL DEFAULT 'pending', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`matched_at\` datetime NULL, \`accepted_at\` datetime NULL, \`completed_at\` datetime NULL, \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`exchange_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`course_sections\` (\`section_id\` int NOT NULL AUTO_INCREMENT, \`section_code\` varchar(255) NOT NULL, \`course_id\` int NOT NULL, \`instructor_id\` int NOT NULL, \`max_students\` int NOT NULL, \`schedule\` varchar(255) NULL, \`current_students\` int NOT NULL DEFAULT '0', \`status\` varchar(255) NOT NULL DEFAULT 'open', \`semester_id\` int NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`section_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`semesters\` (\`semester_id\` int NOT NULL AUTO_INCREMENT, \`start_date\` datetime NOT NULL, \`end_date\` datetime NOT NULL, \`status\` varchar(255) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, PRIMARY KEY (\`semester_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`students\` (\`student_id\` int NOT NULL AUTO_INCREMENT, \`student_code\` varchar(255) NOT NULL, \`user_id\` int NOT NULL, \`full_name\` varchar(255) NOT NULL, \`class_code\` varchar(255) NOT NULL, \`major\` varchar(255) NOT NULL, \`year_of_study\` int NOT NULL, \`current_year\` int NOT NULL, \`current_semester\` int NOT NULL, \`cohort_id\` varchar(255) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_94ea28a151d5f49f6bd4833466\` (\`student_code\`), UNIQUE INDEX \`REL_fb3eff90b11bddf7285f9b4e28\` (\`user_id\`), PRIMARY KEY (\`student_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`user_id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NULL, \`role\` varchar(255) NOT NULL, \`status\` tinyint NOT NULL DEFAULT 1, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`user_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`temporaries\` (\`id\` int NOT NULL AUTO_INCREMENT, \`course_id\` int NOT NULL, \`cohort_id\` varchar(255) NOT NULL, \`status\` varchar(255) NOT NULL DEFAULT 'active', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`class_schedules\` ADD CONSTRAINT \`FK_0c8d8312cac6cafe0974bba8279\` FOREIGN KEY (\`section_id\`) REFERENCES \`course_sections\`(\`section_id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`registrations\` ADD CONSTRAINT \`FK_a42df5f11116b3a8db20c0c6392\` FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`student_id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`registrations\` ADD CONSTRAINT \`FK_e177871c985e3308d6bea2d651d\` FOREIGN KEY (\`section_id\`) REFERENCES \`course_sections\`(\`section_id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` ADD CONSTRAINT \`FK_bd49671f0c876d711047010d72f\` FOREIGN KEY (\`requester_id\`) REFERENCES \`students\`(\`student_id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` ADD CONSTRAINT \`FK_69114788f28fd20f83b75f8f873\` FOREIGN KEY (\`accepter_id\`) REFERENCES \`students\`(\`student_id\`) ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` ADD CONSTRAINT \`FK_e6ca8b042eaf39a5134039efab1\` FOREIGN KEY (\`from_section_id\`) REFERENCES \`course_sections\`(\`section_id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` ADD CONSTRAINT \`FK_62dad235064bed1b5cba0912bd8\` FOREIGN KEY (\`desired_section_id\`) REFERENCES \`course_sections\`(\`section_id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`course_sections\` ADD CONSTRAINT \`FK_348f9a7c13a6b413f10d2a1ef1a\` FOREIGN KEY (\`course_id\`) REFERENCES \`courses\`(\`course_id\`) ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`course_sections\` ADD CONSTRAINT \`FK_94877bfee548220b205e0886dc2\` FOREIGN KEY (\`instructor_id\`) REFERENCES \`instructors\`(\`instructor_id\`) ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`course_sections\` ADD CONSTRAINT \`FK_a04e975d6ece94cf3ec32944e2e\` FOREIGN KEY (\`semester_id\`) REFERENCES \`semesters\`(\`semester_id\`) ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`students\` ADD CONSTRAINT \`FK_5b672e37079ea9049dbe2ff3106\` FOREIGN KEY (\`cohort_id\`) REFERENCES \`cohorts\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`students\` ADD CONSTRAINT \`FK_71d525ce0fe3ee64f7af1d48a93\` FOREIGN KEY (\`current_semester\`) REFERENCES \`semesters\`(\`semester_id\`) ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`students\` ADD CONSTRAINT \`FK_fb3eff90b11bddf7285f9b4e281\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`temporaries\` ADD CONSTRAINT \`FK_ce7d3ea20cd7b3d9d5ea9ef3a0f\` FOREIGN KEY (\`course_id\`) REFERENCES \`courses\`(\`course_id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`temporaries\` ADD CONSTRAINT \`FK_dedd9cacc8a0e2ffa1c6b96558a\` FOREIGN KEY (\`cohort_id\`) REFERENCES \`cohorts\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`temporaries\` DROP FOREIGN KEY \`FK_dedd9cacc8a0e2ffa1c6b96558a\``);
        await queryRunner.query(`ALTER TABLE \`temporaries\` DROP FOREIGN KEY \`FK_ce7d3ea20cd7b3d9d5ea9ef3a0f\``);
        await queryRunner.query(`ALTER TABLE \`students\` DROP FOREIGN KEY \`FK_fb3eff90b11bddf7285f9b4e281\``);
        await queryRunner.query(`ALTER TABLE \`students\` DROP FOREIGN KEY \`FK_71d525ce0fe3ee64f7af1d48a93\``);
        await queryRunner.query(`ALTER TABLE \`students\` DROP FOREIGN KEY \`FK_5b672e37079ea9049dbe2ff3106\``);
        await queryRunner.query(`ALTER TABLE \`course_sections\` DROP FOREIGN KEY \`FK_a04e975d6ece94cf3ec32944e2e\``);
        await queryRunner.query(`ALTER TABLE \`course_sections\` DROP FOREIGN KEY \`FK_94877bfee548220b205e0886dc2\``);
        await queryRunner.query(`ALTER TABLE \`course_sections\` DROP FOREIGN KEY \`FK_348f9a7c13a6b413f10d2a1ef1a\``);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` DROP FOREIGN KEY \`FK_62dad235064bed1b5cba0912bd8\``);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` DROP FOREIGN KEY \`FK_e6ca8b042eaf39a5134039efab1\``);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` DROP FOREIGN KEY \`FK_69114788f28fd20f83b75f8f873\``);
        await queryRunner.query(`ALTER TABLE \`exchange_requests\` DROP FOREIGN KEY \`FK_bd49671f0c876d711047010d72f\``);
        await queryRunner.query(`ALTER TABLE \`registrations\` DROP FOREIGN KEY \`FK_e177871c985e3308d6bea2d651d\``);
        await queryRunner.query(`ALTER TABLE \`registrations\` DROP FOREIGN KEY \`FK_a42df5f11116b3a8db20c0c6392\``);
        await queryRunner.query(`ALTER TABLE \`class_schedules\` DROP FOREIGN KEY \`FK_0c8d8312cac6cafe0974bba8279\``);
        await queryRunner.query(`DROP TABLE \`temporaries\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP INDEX \`REL_fb3eff90b11bddf7285f9b4e28\` ON \`students\``);
        await queryRunner.query(`DROP INDEX \`IDX_94ea28a151d5f49f6bd4833466\` ON \`students\``);
        await queryRunner.query(`DROP TABLE \`students\``);
        await queryRunner.query(`DROP TABLE \`semesters\``);
        await queryRunner.query(`DROP TABLE \`course_sections\``);
        await queryRunner.query(`DROP TABLE \`exchange_requests\``);
        await queryRunner.query(`DROP TABLE \`registrations\``);
        await queryRunner.query(`DROP TABLE \`class_schedules\``);
        await queryRunner.query(`DROP TABLE \`instructors\``);
        await queryRunner.query(`DROP TABLE \`courses\``);
        await queryRunner.query(`DROP TABLE \`cohorts\``);
    }

}
