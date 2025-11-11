import { IsInt, IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTemporaryDto {
  @ApiProperty({ description: 'Course ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  courseId: number;

  @ApiProperty({ description: 'Cohort ID', example: '2021-2025' })
  @IsString()
  @IsNotEmpty()
  cohortId: string;

  @ApiPropertyOptional({ description: 'Status', enum: ['active', 'cancelled'], default: 'active' })
  @IsEnum(['active', 'cancelled'])
  @IsOptional()
  status?: string;
}

export class UpdateTemporaryDto {
  @ApiPropertyOptional({ description: 'Course ID', example: 1 })
  @IsInt()
  @IsOptional()
  courseId?: number;

  @ApiPropertyOptional({ description: 'Cohort ID', example: '2021-2025' })
  @IsString()
  @IsOptional()
  cohortId?: string;

  @ApiPropertyOptional({ description: 'Status', enum: ['active', 'cancelled'] })
  @IsEnum(['active', 'cancelled'])
  @IsOptional()
  status?: string;
}

