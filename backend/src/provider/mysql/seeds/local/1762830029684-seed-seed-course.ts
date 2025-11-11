import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedSeedCourse1762830029684 implements MigrationInterface {
    name = 'SeedSeedCourse1762830029684'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Seed 50 instructors - Khoa học máy tính
        const instructors = [
            { fullName: 'Nguyễn Văn An', department: 'Khoa học máy tính', title: 'Giáo sư' },
            { fullName: 'Trần Thị Bình', department: 'Khoa học máy tính', title: 'Phó giáo sư' },
            { fullName: 'Lê Văn Cường', department: 'Khoa học máy tính', title: 'Tiến sĩ' },
            { fullName: 'Phạm Thị Dung', department: 'Khoa học máy tính', title: 'Thạc sĩ' },
            { fullName: 'Hoàng Văn Giang', department: 'Khoa học máy tính', title: 'Giảng viên' },
            { fullName: 'Huỳnh Thị Hạnh', department: 'Khoa học máy tính', title: 'Giáo sư' },
            { fullName: 'Phan Văn Hùng', department: 'Khoa học máy tính', title: 'Phó giáo sư' },
            { fullName: 'Vũ Thị Khoa', department: 'Khoa học máy tính', title: 'Tiến sĩ' },
            { fullName: 'Võ Văn Lan', department: 'Khoa học máy tính', title: 'Thạc sĩ' },
            { fullName: 'Đặng Thị Minh', department: 'Khoa học máy tính', title: 'Giảng viên' },
            { fullName: 'Bùi Văn Nga', department: 'Khoa học máy tính', title: 'Giáo sư' },
            { fullName: 'Đỗ Thị Phong', department: 'Khoa học máy tính', title: 'Phó giáo sư' },
            { fullName: 'Hồ Văn Quang', department: 'Khoa học máy tính', title: 'Tiến sĩ' },
            { fullName: 'Ngô Thị Sơn', department: 'Khoa học máy tính', title: 'Thạc sĩ' },
            { fullName: 'Dương Văn Thảo', department: 'Khoa học máy tính', title: 'Giảng viên' },
            { fullName: 'Nguyễn Thị Tuấn', department: 'Khoa học máy tính', title: 'Giáo sư' },
            { fullName: 'Trần Văn Uyên', department: 'Khoa học máy tính', title: 'Phó giáo sư' },
            { fullName: 'Lê Thị Việt', department: 'Khoa học máy tính', title: 'Tiến sĩ' },
            { fullName: 'Phạm Văn Xuân', department: 'Khoa học máy tính', title: 'Thạc sĩ' },
            { fullName: 'Hoàng Thị Yến', department: 'Khoa học máy tính', title: 'Giảng viên' },
            { fullName: 'Huỳnh Văn Đức', department: 'Khoa học máy tính', title: 'Giáo sư' },
            { fullName: 'Phan Thị Hoa', department: 'Khoa học máy tính', title: 'Phó giáo sư' },
            { fullName: 'Vũ Văn Long', department: 'Khoa học máy tính', title: 'Tiến sĩ' },
            { fullName: 'Võ Thị Mai', department: 'Khoa học máy tính', title: 'Thạc sĩ' },
            { fullName: 'Đặng Văn Nam', department: 'Khoa học máy tính', title: 'Giảng viên' },
            { fullName: 'Bùi Thị Oanh', department: 'Khoa học máy tính', title: 'Giáo sư' },
            { fullName: 'Đỗ Văn Phúc', department: 'Khoa học máy tính', title: 'Phó giáo sư' },
            { fullName: 'Hồ Thị Quyên', department: 'Khoa học máy tính', title: 'Tiến sĩ' },
            { fullName: 'Ngô Văn Sang', department: 'Khoa học máy tính', title: 'Thạc sĩ' },
            { fullName: 'Dương Thị Tâm', department: 'Khoa học máy tính', title: 'Giảng viên' },
            { fullName: 'Nguyễn Văn Thành', department: 'Khoa học máy tính', title: 'Giáo sư' },
            { fullName: 'Trần Thị Uy', department: 'Khoa học máy tính', title: 'Phó giáo sư' },
            { fullName: 'Lê Văn Vinh', department: 'Khoa học máy tính', title: 'Tiến sĩ' },
            { fullName: 'Phạm Thị Vân', department: 'Khoa học máy tính', title: 'Thạc sĩ' },
            { fullName: 'Hoàng Văn Vũ', department: 'Khoa học máy tính', title: 'Giảng viên' },
            { fullName: 'Huỳnh Thị Xuyên', department: 'Khoa học máy tính', title: 'Giáo sư' },
            { fullName: 'Phan Văn Yên', department: 'Khoa học máy tính', title: 'Phó giáo sư' },
            { fullName: 'Vũ Thị Ánh', department: 'Khoa học máy tính', title: 'Tiến sĩ' },
            { fullName: 'Võ Văn Bảo', department: 'Khoa học máy tính', title: 'Thạc sĩ' },
            { fullName: 'Đặng Thị Chi', department: 'Khoa học máy tính', title: 'Giảng viên' },
            { fullName: 'Bùi Văn Đạt', department: 'Khoa học máy tính', title: 'Giáo sư' },
            { fullName: 'Đỗ Thị Em', department: 'Khoa học máy tính', title: 'Phó giáo sư' },
            { fullName: 'Hồ Văn Phú', department: 'Khoa học máy tính', title: 'Tiến sĩ' },
            { fullName: 'Ngô Thị Quỳnh', department: 'Khoa học máy tính', title: 'Thạc sĩ' },
            { fullName: 'Dương Văn Rạng', department: 'Khoa học máy tính', title: 'Giảng viên' },
            { fullName: 'Nguyễn Thị Sinh', department: 'Khoa học máy tính', title: 'Giáo sư' },
            { fullName: 'Trần Văn Tài', department: 'Khoa học máy tính', title: 'Phó giáo sư' },
            { fullName: 'Lê Thị Uyên', department: 'Khoa học máy tính', title: 'Tiến sĩ' },
            { fullName: 'Phạm Văn Văn', department: 'Khoa học máy tính', title: 'Thạc sĩ' },
            { fullName: 'Hoàng Thị Vinh', department: 'Khoa học máy tính', title: 'Giảng viên' },
            { fullName: 'Huỳnh Văn Vũ', department: 'Khoa học máy tính', title: null },
            { fullName: 'Phan Thị Xuân', department: 'Khoa học máy tính', title: null },
        ];

        for (const instructor of instructors) {
            const titleValue = instructor.title ? `'${instructor.title}'` : 'NULL';
            await queryRunner.query(
                `INSERT INTO \`instructors\` (\`full_name\`, \`department\`, \`title\`) VALUES ('${instructor.fullName}', '${instructor.department}', ${titleValue})`
            );
        }

        // Seed 10 courses - Khoa học máy tính (code không dấu)
        const courses = [
            { courseId: 1001, code: 'CS101', name: 'Nhap mon khoa hoc may tinh', credits: 3 },
            { courseId: 1002, code: 'CS102', name: 'Lap trinh can ban', credits: 3 },
            { courseId: 1003, code: 'CS201', name: 'Cau truc du lieu va giai thuat', credits: 4 },
            { courseId: 1004, code: 'CS202', name: 'Co so du lieu', credits: 3 },
            { courseId: 1005, code: 'CS301', name: 'He dieu hanh', credits: 3 },
            { courseId: 1006, code: 'CS302', name: 'Mang may tinh', credits: 3 },
            { courseId: 1007, code: 'CS401', name: 'Cong nghe phan mem', credits: 3 },
            { courseId: 1008, code: 'CS402', name: 'Tri tue nhan tao', credits: 3 },
            { courseId: 1009, code: 'CS403', name: 'An toan thong tin', credits: 3 },
            { courseId: 1010, code: 'CS404', name: 'Khoa hoc du lieu', credits: 3 },
        ];

        for (const course of courses) {
            await queryRunner.query(
                `INSERT INTO \`courses\` (\`course_id\`, \`code\`, \`name\`, \`credits\`) VALUES (${course.courseId}, '${course.code}', '${course.name}', ${course.credits})`
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Delete all seeded courses
        await queryRunner.query(
            `DELETE FROM \`courses\` WHERE \`course_id\` IN (1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010)`
        );

        // Delete all seeded instructors from Khoa học máy tính
        await queryRunner.query(
            `DELETE FROM \`instructors\` WHERE \`department\` = 'Khoa học máy tính'`
        );
    }

}
