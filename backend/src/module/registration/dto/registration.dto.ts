import { IsInt, IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRegistrationDto {
  @ApiProperty({ description: 'Section ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  sectionId: number;
}

export class UpdateRegistrationDto {
  @ApiPropertyOptional({ description: 'Student ID', example: 1 })
  @IsInt()
  @IsOptional()
  studentId?: number;

  @ApiPropertyOptional({ description: 'Section ID', example: 1 })
  @IsInt()
  @IsOptional()
  sectionId?: number;

  @ApiPropertyOptional({ description: 'Registration status', enum: ['active', 'cancelled'] })
  @IsEnum(['active', 'cancelled'])
  @IsOptional()
  status?: string;
}

