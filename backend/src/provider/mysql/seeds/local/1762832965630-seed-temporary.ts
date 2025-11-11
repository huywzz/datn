import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedTemporary1762832965630 implements MigrationInterface {
    name = 'SeedTemporary1762832965630'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Course codes for cohort K21
        const courseCodes = ['CS101', 'CS102', 'CS201', 'CS202', 'CS301', 'CS302', 'CS401', 'CS402'];
        const cohortId = 'K21';

        // Get course IDs by code
        const courses = await queryRunner.query(
            `SELECT course_id, code FROM \`courses\` WHERE code IN (${courseCodes.map(code => `'${code}'`).join(', ')})`
        );

        // Verify cohort exists
        const cohort = await queryRunner.query(
            `SELECT id FROM \`cohorts\` WHERE id = '${cohortId}'`
        );

        if (cohort.length === 0) {
            throw new Error(`Cohort with id '${cohortId}' does not exist. Please create it first.`);
        }

        // Insert Temporary records for each course
        for (const course of courses) {
            const courseId = course.course_id;
            const status = 'active';

            await queryRunner.query(
                `INSERT INTO \`temporaries\` (\`course_id\`, \`cohort_id\`, \`status\`) VALUES (${courseId}, '${cohortId}', '${status}')`
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Course codes for cohort K21
        const courseCodes = ['CS101', 'CS102', 'CS201', 'CS202', 'CS301', 'CS302', 'CS401', 'CS402'];
        const cohortId = 'K21';

        // Get course IDs by code
        const courses = await queryRunner.query(
            `SELECT course_id FROM \`courses\` WHERE code IN (${courseCodes.map(code => `'${code}'`).join(', ')})`
        );

        const courseIds = courses.map((course: { course_id: number }) => course.course_id);

        // Delete Temporary records for cohort K21 and specified courses
        if (courseIds.length > 0) {
            await queryRunner.query(
                `DELETE FROM \`temporaries\` WHERE \`cohort_id\` = '${cohortId}' AND \`course_id\` IN (${courseIds.join(', ')})`
            );
        }
    }

}
