import { IsString, IsNotEmpty, IsEmail, IsEnum, IsInt, Min, Max, IsOptional, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from 'src/common/constant/enum';

export class LoginDto {
  @ApiProperty({ description: 'User email', example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'User password', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RegisterDto {
  @ApiProperty({ description: 'User name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'User email', example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'User password', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: 'User role', enum: UserRole, example: UserRole.STUDENT })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  // Student specific fields (required when role is STUDENT)
  @ApiPropertyOptional({ description: 'Class code (required for student)', example: 'CS101' })
  @ValidateIf((o) => o.role === UserRole.STUDENT)
  @IsString()
  @IsNotEmpty()
  classCode?: string;

  @ApiPropertyOptional({ description: 'Major (required for student)', example: 'it' })
  @ValidateIf((o) => o.role === UserRole.STUDENT)
  @IsString()
  @IsNotEmpty()
  major?: string;

  @ApiPropertyOptional({ description: 'Year of study (required for student)', example: 1 })
  @ValidateIf((o) => o.role === UserRole.STUDENT)
  @IsInt()
  @Min(1)
  @Max(10)
  @IsNotEmpty()
  yearOfStudy?: number;

  @ApiPropertyOptional({ description: 'Current year (required for student)', example: 2024 })
  @ValidateIf((o) => o.role === UserRole.STUDENT)
  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsNotEmpty()
  currentYear?: number;

  @ApiPropertyOptional({ description: 'Current semester (required for student)', example: 4 })
  @ValidateIf((o) => o.role === UserRole.STUDENT)
  @IsInt()
  @Min(1)
  @Max(3)
  @IsNotEmpty()
  currentSemester?: number;

  @ApiPropertyOptional({ description: 'Cohort ID (required for student)', example: '2021-2025' })
  @ValidateIf((o) => o.role === UserRole.STUDENT)
  @IsString()
  @IsNotEmpty()
  cohortId?: string;

  @ApiPropertyOptional({ description: 'Student code (required for student)', example: '21IT279' })
  @ValidateIf((o) => o.role === UserRole.STUDENT)
  @IsString()
  @IsNotEmpty()
  studentCode?: string;

  @ApiPropertyOptional({ description: 'Semester ID (required for student)', example: 4 })
  @ValidateIf((o) => o.role === UserRole.STUDENT)
  @IsInt()
  @IsNotEmpty()
  semesterId?: number;
}

export class GoogleLoginDto {
  @ApiProperty({ description: 'Google ID token from client', example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...' })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

