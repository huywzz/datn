import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedCourseSection1762830763148 implements MigrationInterface {
    name = 'SeedCourseSection1762830763148'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Get all courses
        const courses = await queryRunner.query(
            `SELECT course_id, code FROM \`courses\` WHERE course_id BETWEEN 1001 AND 1010 ORDER BY course_id`
        );

        // Get all instructor IDs from database
        const instructors = await queryRunner.query(
            `SELECT instructor_id FROM \`instructors\` WHERE department = 'Khoa học máy tính' ORDER BY instructor_id`
        );
        const instructorIds = instructors.map((inst: { instructor_id: number }) => inst.instructor_id);

        // Create 10 sections for each course
        for (const course of courses) {
            const courseId = course.course_id;
            const courseCode = course.code;

            for (let sectionNum = 1; sectionNum <= 10; sectionNum++) {
                // Random instructor
                const randomInstructorIndex = Math.floor(Math.random() * instructorIds.length);
                const instructorId = instructorIds[randomInstructorIndex];

                // Section code format: CS101-01, CS101-02, ..., CS101-10
                const sectionCode = `${courseCode}-${String(sectionNum).padStart(2, '0')}`;
                const maxStudents = 50;
                const status = 'open';

                await queryRunner.query(
                    `INSERT INTO \`course_sections\` (\`section_code\`, \`course_id\`, \`instructor_id\`, \`max_students\`, \`status\`, \`semester_id\`) VALUES ('${sectionCode}', ${courseId}, ${instructorId}, ${maxStudents}, '${status}', 4)`
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Delete all course sections for courses 1001-1010
        await queryRunner.query(
            `DELETE FROM \`course_sections\` WHERE \`course_id\` BETWEEN 1001 AND 1010`
        );
    }

}
