import { MigrationInterface, QueryRunner } from "typeorm";
import * as bcrypt from 'bcrypt';

export class SeedInitDB1764575218082 implements MigrationInterface {
    name = 'SeedInitDB1764575218082'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Seed semesters
        await queryRunner.query(
            `INSERT INTO \`semesters\` (\`start_date\`, \`end_date\`, \`status\`) VALUES
            ('2024-08-01 00:00:00', '2025-01-10 00:00:00', 'active'),
            ('2025-01-12 00:00:00', '2025-06-12 00:00:00', 'active'),
            ('2025-08-01 00:00:00', '2026-01-10 00:00:00', 'active'),
            ('2026-01-12 00:00:00', '2026-06-10 00:00:00', 'active')`
        );

        // Lấy semester_id bất kỳ (ví dụ: bản ghi active đầu tiên) để gán cho course_sections
        const semesters = await queryRunner.query(
            `SELECT semester_id FROM \`semesters\` WHERE status = 'active' ORDER BY semester_id LIMIT 1`
        );
        const semesterId = 4

        // 2. Seed cohort K21
        await queryRunner.query(
            `INSERT INTO \`cohorts\` (\`id\`, \`code\`, \`name\`, \`start_year\`, \`end_year\`)
             VALUES ('K22', 'K22', 'K22', '2021-10-01 00:00:00', '2026-06-01 00:00:00')`
        );

        // 3. Seed instructors (Khoa học máy tính)
        const instructors = [
            { fullName: 'Nguyễn Văn An', department: 'Khoa học máy tính', title: 'Giáo sư' },
            { fullName: 'Trần Thị Bình', department: 'Khoa học máy tính', title: 'Phó giáo sư' },
            { fullName: 'Lê Văn Cường', department: 'Khoa học máy tính', title: 'Tiến sĩ' },
            { fullName: 'Phạm Thị Dung', department: 'Khoa học máy tính', title: 'Thạc sĩ' },
            { fullName: 'Hoàng Văn Giang', department: 'Khoa học máy tính', title: 'Giảng viên' },
            { fullName: 'Huỳnh Thị Hạnh', department: 'Khoa học máy tính', title: 'Giáo sư' },
            { fullName: 'Phan Văn Hùng', department: 'Khoa học máy tính', title: 'Phó giáo sư' },
            { fullName: 'Vũ Trịnh Khoa', department: 'Khoa học máy tính', title: 'Tiến sĩ' },
            { fullName: 'Võ Phương Lan', department: 'Khoa học máy tính', title: 'Thạc sĩ' },
            { fullName: 'Đặng Văn Minh', department: 'Khoa học máy tính', title: 'Giảng viên' }
        ];

        for (const instructor of instructors) {
            const titleValue = instructor.title ? `'${instructor.title}'` : 'NULL';
            await queryRunner.query(
                `INSERT INTO \`instructors\` (\`full_name\`, \`department\`, \`title\`)
                 VALUES ('${instructor.fullName}', '${instructor.department}', ${titleValue})`
            );
        }

        // 4. Seed 9 courses với courseId 1-9, code là viết tắt tên môn
        const courses = [
            { courseId: 1, code: 'DTDM', name: 'Điện Toán Đám Mây', credits: 3 },
            { courseId: 2, code: 'LTW', name: 'Lập Trình Web', credits: 3 },
            { courseId: 3, code: 'CSDL', name: 'Cơ Sở Dữ Liệu', credits: 3 },
            { courseId: 4, code: 'TTNT', name: 'Trí Tuệ Nhân Tạo', credits: 3 },
            { courseId: 5, code: 'KHDL', name: 'Khoa Học Dữ Liệu', credits: 3 },
            { courseId: 6, code: 'CTDL', name: 'Cấu Trúc Dữ Liệu', credits: 3 },
            { courseId: 7, code: 'LTCB', name: 'Lập Trình Căn Bản', credits: 3 },
            { courseId: 8, code: 'PTTK', name: 'Phân Tích Thiết Kế Hệ Thống', credits: 3 },
            { courseId: 9, code: 'ANM', name: 'An Ninh Mạng', credits: 3 }
        ];

        for (const course of courses) {
            await queryRunner.query(
                `INSERT INTO \`courses\` (\`course_id\`, \`code\`, \`name\`, \`credits\`)
                 VALUES (${course.courseId}, '${course.code}', '${course.name}', ${course.credits})`
            );
        }

        // Lấy tất cả instructor_id của KHMT
        const instructorRows = await queryRunner.query(
            `SELECT instructor_id FROM \`instructors\` WHERE department = 'Khoa học máy tính' ORDER BY instructor_id`
        );
        const instructorIds = instructorRows.map((inst: { instructor_id: number }) => inst.instructor_id);

        // 5. Seed course_sections: tạo 5 lớp học phần cho mỗi môn
        for (const course of courses) {
            const courseId = course.courseId;
            const courseCode = course.code;

            for (let sectionNum = 1; sectionNum <= 5; sectionNum++) {
                const randomInstructorIndex = Math.floor(Math.random() * instructorIds.length);
                const instructorId = instructorIds[randomInstructorIndex];
                const sectionCode = `${courseCode}-${String(sectionNum).padStart(2, '0')}`;
                const maxStudents = 50;
                const status = 'open';

                await queryRunner.query(
                    `INSERT INTO \`course_sections\` (\`section_code\`, \`course_id\`, \`instructor_id\`, \`max_students\`, \`status\`, \`semester_id\`)
                     VALUES ('${sectionCode}', ${courseId}, ${instructorId}, ${maxStudents}, '${status}', ${semesterId || 'NULL'})`
                );
            }
        }

        // 6. Seed class_schedules: mỗi section tối đa 2 lịch học
        const sections = await queryRunner.query(
            `SELECT section_id FROM \`course_sections\` WHERE course_id BETWEEN 1 AND 9 ORDER BY section_id`
        );

        const getValidPeriods = (): number[] => {
            return [1, 2, 3, 4, 6, 7, 8, 9];
        };

        const getValidEndPeriods = (startPeriod: number): number[] => {
            const valid = [2, 3, 4, 6, 7, 8, 9, 10];
            return valid.filter(end => end > startPeriod && end <= startPeriod + 3);
        };

        const generateRoom = (): string => {
            const prefix = Math.random() < 0.5 ? 'K' : 'V';
            const building = Math.random() < 0.5 ? 'A' : 'B';
            const hundred = Math.floor(Math.random() * 3) + 1;
            const tens = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
            return `${prefix}.${building}${hundred}${tens}`;
        };

        const formatSchedule = (dayOfWeek: number, startPeriod: number, endPeriod: number, room: string): string => {
            const days = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
            return `${days[dayOfWeek]} (Tiết ${startPeriod}-${endPeriod}) - ${room}`;
        };

        const validStartPeriods = getValidPeriods();
        const daysOfWeek = [1, 2, 3, 4, 5, 6];

        for (const section of sections) {
            const sectionId = section.section_id;
            const schedules: string[] = [];

            // Mỗi section có 1-2 lịch học
            const numSchedules = Math.floor(Math.random() * 2) + 1; // 1 hoặc 2

            for (let i = 0; i < numSchedules; i++) {
                const dayOfWeek = daysOfWeek[Math.floor(Math.random() * daysOfWeek.length)];
                const startPeriod = validStartPeriods[Math.floor(Math.random() * validStartPeriods.length)];
                const validEndPeriods = getValidEndPeriods(startPeriod);
                if (validEndPeriods.length === 0) {
                    continue;
                }
                const endPeriod = validEndPeriods[Math.floor(Math.random() * validEndPeriods.length)];
                const room = generateRoom();

                await queryRunner.query(
                    `INSERT INTO \`class_schedules\` (\`section_id\`, \`day_of_week\`, \`start_period\`, \`end_period\`, \`room\`)
                     VALUES (${sectionId}, '${dayOfWeek}', ${startPeriod}, ${endPeriod}, '${room}')`
                );

                schedules.push(formatSchedule(dayOfWeek, startPeriod, endPeriod, room));
            }

            if (schedules.length > 0) {
                const scheduleString = schedules.join('; ');
                await queryRunner.query(
                    `UPDATE \`course_sections\` SET \`schedule\` = '${scheduleString}' WHERE \`section_id\` = ${sectionId}`
                );
            }
        }

        // 7. Seed temporaries: mọi môn trong seed-course đều có trong temporaries cho cohort K21
        const cohortId = 'K22';
        for (const course of courses) {
            await queryRunner.query(
                `INSERT INTO \`temporaries\` (\`course_id\`, \`cohort_id\`, \`status\`)
                 VALUES (${course.courseId}, '${cohortId}', 'active')`
            );
        }

        // 8. Seed users: 1 admin, 2 students (password = 'password')
        const hashedPassword = await bcrypt.hash('password', 10);

        // Admin user
        const adminInsertResult = await queryRunner.query(
            `INSERT INTO \`users\` (\`name\`, \`email\`, \`password\`, \`role\`, \`status\`)
             VALUES ('Admin', 'admin@gmail.com', '${hashedPassword}', 'admin', true)`
        );

        // Student user 1
        const student1InsertResult = await queryRunner.query(
            `INSERT INTO \`users\` (\`name\`, \`email\`, \`password\`, \`role\`, \`status\`)
             VALUES ('Student One', 'student1@gmail.com', '${hashedPassword}', 'student', true)`
        );

        // Student user 2
        const student2InsertResult = await queryRunner.query(
            `INSERT INTO \`users\` (\`name\`, \`email\`, \`password\`, \`role\`, \`status\`)
             VALUES ('Student Two', 'student2@gmail.com', '${hashedPassword}', 'student', true)`
        );

        // Lấy user_id từ kết quả insert
        const student1UserId = (student1InsertResult as { insertId: number }).insertId;
        const student2UserId = (student2InsertResult as { insertId: number }).insertId;

        // 9. Seed student records cho 2 student (thuộc cohort K22)
        await queryRunner.query(
            `INSERT INTO \`students\` (\`student_code\`, \`user_id\`, \`full_name\`, \`class_code\`, \`major\`, \`year_of_study\`, \`current_year\`, \`current_semester\`, \`cohort_id\`)
             VALUES 
             ('K22-001', ${student1UserId}, 'Student One', 'CNTT1', 'it', 1, 1, ${semesterId}, 'K22'),
             ('K22-002', ${student2UserId}, 'Student Two', 'CNTT1', 'it', 1, 1, ${semesterId}, 'K22')`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Xóa temporaries cho cohort K21 và course_id 1-9
        await queryRunner.query(
            `DELETE FROM \`temporaries\` WHERE \`cohort_id\` = 'K22' AND \`course_id\` BETWEEN 1 AND 9`
        );

        // Xóa 2 student user và 1 admin user (cascade sẽ xóa bản ghi students tương ứng)
        await queryRunner.query(
            `DELETE FROM \`users\` WHERE \`email\` IN ('admin@example.com', 'student1@example.com', 'student2@example.com')`
        );

        // Xóa class_schedules & clear schedule
        await queryRunner.query(
            `DELETE cs FROM \`class_schedules\` cs
             INNER JOIN \`course_sections\` cs2 ON cs.section_id = cs2.section_id
             WHERE cs2.course_id BETWEEN 1 AND 9`
        );
        await queryRunner.query(
            `UPDATE \`course_sections\` SET \`schedule\` = NULL WHERE \`course_id\` BETWEEN 1 AND 9`
        );

        // Xóa course_sections cho course_id 1-9
        await queryRunner.query(
            `DELETE FROM \`course_sections\` WHERE \`course_id\` BETWEEN 1 AND 9`
        );

        // Xóa courses 1-9
        await queryRunner.query(
            `DELETE FROM \`courses\` WHERE \`course_id\` BETWEEN 1 AND 9`
        );

        // Xóa instructors của KHMT
        await queryRunner.query(
            `DELETE FROM \`instructors\` WHERE \`department\` = 'Khoa học máy tính'`
        );

        // Xóa cohort K21
        await queryRunner.query(
            `DELETE FROM \`cohorts\` WHERE \`id\` = 'K22'`
        );

        // Xóa các semesters đã seed
        await queryRunner.query(
            `DELETE FROM \`semesters\`
             WHERE (\`start_date\`, \`end_date\`) IN
             (('2024-08-01 00:00:00','2025-01-10 00:00:00'),
              ('2025-01-12 00:00:00','2025-06-12 00:00:00'),
              ('2025-08-01 00:00:00','2026-01-10 00:00:00'),
              ('2026-01-12 00:00:00','2026-06-10 00:00:00'))`
        );
    }

}
