import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedClassSchedule1762831317579 implements MigrationInterface {
    name = 'SeedClassSchedule1762831317579'

    // Helper function to generate room code
    private generateRoom(): string {
        const prefix = Math.random() < 0.5 ? 'K' : 'V';
        const building = Math.random() < 0.5 ? 'A' : 'B';
        const hundred = Math.floor(Math.random() * 3) + 1; // 1-3
        const tens = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0'); // 01-12
        return `${prefix}.${building}${hundred}${tens}`;
    }

    // Helper function to get valid periods (excluding 5)
    private getValidPeriods(): number[] {
        return [1, 2, 3, 4, 6, 7, 8, 9];
    }

    // Helper function to get valid end periods (excluding 5, starting from 2)
    private getValidEndPeriods(startPeriod: number): number[] {
        const valid = [2, 3, 4, 6, 7, 8, 9, 10];
        // Filter: endPeriod must be > startPeriod and within 4 periods
        return valid.filter(end => end > startPeriod && end <= startPeriod + 3);
    }

    // Helper function to format schedule string
    private formatSchedule(dayOfWeek: number, startPeriod: number, endPeriod: number, room: string): string {
        const days = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        return `${days[dayOfWeek]} (Tiết ${startPeriod}-${endPeriod}) - ${room}`;
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Get all course sections
        const sections = await queryRunner.query(
            `SELECT section_id, section_code FROM \`course_sections\` WHERE course_id BETWEEN 1001 AND 1010 ORDER BY section_id`
        );

        const validStartPeriods = this.getValidPeriods();
        const daysOfWeek = [1, 2, 3, 4, 5, 6];

        for (const section of sections) {
            const sectionId = section.section_id;
            const schedules: string[] = [];

            // Each section can have multiple class schedules (e.g., 2-3 buổi/tuần)
            // Random 1-3 class schedules per section
            const numSchedules = Math.floor(Math.random() * 3) + 1;

            for (let i = 0; i < numSchedules; i++) {
                // Random day of week
                const dayOfWeek = daysOfWeek[Math.floor(Math.random() * daysOfWeek.length)];

                // Random start period (excluding 5)
                const startPeriod = validStartPeriods[Math.floor(Math.random() * validStartPeriods.length)];

                // Get valid end periods (must be > startPeriod, within 4 periods, excluding 5)
                const validEndPeriods = this.getValidEndPeriods(startPeriod);
                if (validEndPeriods.length === 0) continue;

                const endPeriod = validEndPeriods[Math.floor(Math.random() * validEndPeriods.length)];

                // Generate room
                const room = this.generateRoom();

                // Insert class schedule
                await queryRunner.query(
                    `INSERT INTO \`class_schedules\` (\`section_id\`, \`day_of_week\`, \`start_period\`, \`end_period\`, \`room\`) VALUES (${sectionId}, '${dayOfWeek}', ${startPeriod}, ${endPeriod}, '${room}')`
                );

                // Build schedule string for course_sections update
                schedules.push(this.formatSchedule(dayOfWeek, startPeriod, endPeriod, room));
            }

            // Update course_sections with schedule string
            if (schedules.length > 0) {
                const scheduleString = schedules.join('; ');
                await queryRunner.query(
                    `UPDATE \`course_sections\` SET \`schedule\` = '${scheduleString}' WHERE \`section_id\` = ${sectionId}`
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Delete all class schedules for sections of courses 1001-1010
        await queryRunner.query(
            `DELETE cs FROM \`class_schedules\` cs 
             INNER JOIN \`course_sections\` cs2 ON cs.section_id = cs2.section_id 
             WHERE cs2.course_id BETWEEN 1001 AND 1010`
        );

        // Clear schedule field in course_sections
        await queryRunner.query(
            `UPDATE \`course_sections\` SET \`schedule\` = NULL WHERE \`course_id\` BETWEEN 1001 AND 1010`
        );
    }

}
