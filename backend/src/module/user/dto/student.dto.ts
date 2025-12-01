import { IsString, IsNotEmpty, IsEmail, IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterStudentDto {
  @ApiProperty({ description: 'Student full name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: 'Student email', example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Student password', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: 'Class code', example: 'CS101' })
  @IsString()
  @IsNotEmpty()
  classCode: string;

  @ApiProperty({ description: 'Major', example: 'it' })
  @IsString()
  @IsNotEmpty()
  major: string;

  @ApiProperty({ description: 'Year of study', example: 1 })
  @IsInt()
  @Min(1)
  @Max(10)
  @IsNotEmpty()
  yearOfStudy: number;

  @ApiProperty({ description: 'Current year', example: 2024 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsNotEmpty()
  currentYear: number;

  @ApiProperty({ description: 'Current semester', example: 1 })
  @IsInt()
  @Min(1)
  @Max(3)
  @IsNotEmpty()
  currentSemester: number;

  @ApiProperty({ description: 'Cohort ID', example: '2021-2025' })
  @IsString()
  @IsNotEmpty()
  cohortId: string;
}

export class LoginStudentDto {
  @ApiProperty({ description: 'Student email', example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Student password', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class FilterStudentDto {
  @ApiProperty({ description: 'Cohort ID to filter by', example: '2021-2025' })
  @IsString()
  @IsNotEmpty()
  cohortId: string;

  @ApiPropertyOptional({ description: 'Search keyword for student name', example: 'Nguyen' })
  @IsString()
  @IsOptional()
  search?: string;
}

