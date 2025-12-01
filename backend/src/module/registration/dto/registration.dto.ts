import { IsInt, IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRegistrationDto {
  @ApiProperty({ description: 'Section ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  sectionId: number;

  @ApiPropertyOptional({ description: 'Student ID (Admin only)', example: 1 })
  @IsInt()
  @IsOptional()
  studentId?: number;
}



