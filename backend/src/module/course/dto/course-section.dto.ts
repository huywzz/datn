import { IsInt, IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

