import { IsInt, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ description: 'Course ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  courseId: number;

  @ApiProperty({ description: 'Course code', example: 'CS101' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Course name', example: 'Introduction to Computer Science' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Number of credits', example: 3 })
  @IsInt()
  @IsNotEmpty()
  credits: number;
}

export class UpdateCourseDto {
  @ApiPropertyOptional({ description: 'Course code', example: 'CS101' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: 'Course name', example: 'Introduction to Computer Science' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Number of credits', example: 3 })
  @IsInt()
  @IsOptional()
  credits?: number;
}

