import { plainToInstance, Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  Min,
  Max,
  validateSync,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MAX_STUDENTS_PER_SECTION } from 'src/common/constant/constant';
import { DayOfWeek, Period } from 'src/common/constant/enum';

export class CreateCourseSectionDto {
  @ApiProperty({ description: 'Section code', example: '01' })
  @IsString()
  @IsNotEmpty()
  sectionCode: string;

  @ApiProperty({ description: 'Course ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  courseId: number;

  @ApiProperty({ description: 'Instructor ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  instructorId: number;

  @ApiProperty({ description: 'Maximum number of students', example: 50 })
  @IsInt()
  @IsNotEmpty()
  maxStudents: number;

  @ApiPropertyOptional({ description: 'Schedule information', example: 'Mon, Wed, Fri 8:00-9:30' })
  @IsString()
  @IsOptional()
  schedule?: string;

  @ApiPropertyOptional({ description: 'Section status', enum: ['open', 'closed'], default: 'open' })
  @IsEnum(['open', 'closed'])
  @IsOptional()
  status?: string;
}

export class UpdateCourseSectionDto {
  @ApiPropertyOptional({ description: 'Section code', example: '01' })
  @IsString()
  @IsOptional()
  sectionCode?: string;

  @ApiPropertyOptional({ description: 'Course ID', example: 1 })
  @IsInt()
  @IsOptional()
  courseId?: number;

  @ApiPropertyOptional({ description: 'Instructor ID', example: 1 })
  @IsInt()
  @IsOptional()
  instructorId?: number;

  @ApiPropertyOptional({ description: 'Maximum number of students', example: 50 })
  @IsInt()
  @IsOptional()
  maxStudents?: number;

  @ApiPropertyOptional({ description: 'Schedule information', example: 'Mon, Wed, Fri 8:00-9:30' })
  @IsString()
  @IsOptional()
  schedule?: string;

  @ApiPropertyOptional({ description: 'Section status', enum: ['open', 'closed'] })
  @IsEnum(['open', 'closed'])
  @IsOptional()
  status?: string;
}

export class ImportCourseSectionDto {
  @ApiProperty({ description: 'Semester ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  semesterId: number;
}

export class CourseSectionImportRowDto {
  @Transform(({ value }) => (value !== undefined && value !== null ? String(value).trim() : ''))
  @IsString()
  @IsNotEmpty()
  sectionCode: string;

  @Transform(({ value }) => (value !== undefined && value !== null ? String(value).trim() : ''))
  @IsString()
  @IsNotEmpty()
  courseName: string;

  @Transform(({ value }) => (value !== undefined && value !== null ? String(value).trim() : ''))
  @IsString()
  @IsNotEmpty()
  instructorName: string;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(MAX_STUDENTS_PER_SECTION)
  maxStudents: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(DayOfWeek.MONDAY)
  @Max(DayOfWeek.SATURDAY)
  dayOfWeek: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(Period.ONE)
  @Max(Period.NINE)
  startPeriod: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(Period.TWO)
  @Max(Period.NINE)
  endPeriod: number;

  @Transform(({ value }) =>
    value !== undefined && value !== null && String(value).trim() !== '' ? String(value).trim() : undefined,
  )
  @IsOptional()
  @IsString()
  room?: string;

  static fromExcelRow(row: Record<string, unknown>): { data?: CourseSectionImportRowDto; errors: string[] } {
    const mapped = {
      sectionCode: row['Section code'],
      courseName: row['Course'],
      instructorName: row['Instructor name'],
      maxStudents: row['Max student'],
      dayOfWeek: row['Day of week'],
      startPeriod: row['Start period'],
      endPeriod: row['End period'],
      room: row['Room'] ?? undefined,
    };

    const instance = plainToInstance(CourseSectionImportRowDto, mapped, {
      enableImplicitConversion: false,
    });

    const validationErrors = validateSync(instance, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });

    const errors: string[] = validationErrors.flatMap((error) =>
      error.constraints ? Object.values(error.constraints) : [],
    );

    if (instance.endPeriod < instance.startPeriod) {
      errors.push('end period must be greater than or equal to start period');
    }

    if (errors.length > 0) {
      return { errors };
    }

    return { data: instance, errors: [] };
  }
}

