import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional } from 'class-validator';

export class ImportTemporaryDto {
    @ApiProperty({ type: 'string', format: 'binary', description: 'Excel file' })
    file: any;

    @ApiProperty({ description: 'Registration Start Date', example: '2024-01-01T00:00:00Z' })
    @IsDateString()
    @IsNotEmpty()
    registrationStartDate: string;

    @ApiProperty({ description: 'Registration End Date', example: '2024-01-15T23:59:59Z' })
    @IsDateString()
    @IsNotEmpty()
    registrationEndDate: string;
}

export class TemporaryImportRowDto {
    courseName: string;
    cohortName: string;

    static fromExcelRow(row: any): { data?: TemporaryImportRowDto; errors: string[] } {
        const errors: string[] = [];
        const courseName = row['Course Name'] || row['Tên học phần'];
        const cohortName = row['Cohort Name'] || row['Khóa'];

        if (!courseName) {
            errors.push('Missing "Course Name" or "Tên học phần"');
        }
        if (!cohortName) {
            errors.push('Missing "Cohort Name" or "Khóa"');
        }

        if (errors.length > 0) {
            return { errors };
        }

        return {
            data: {
                courseName: String(courseName).trim(),
                cohortName: String(cohortName).trim(),
            },
            errors: [],
        };
    }
}
