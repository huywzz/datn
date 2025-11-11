import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInstructorDto {
  @ApiProperty({ description: 'Full name', example: 'Dr. John Smith' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: 'Department', example: 'Computer Science' })
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiPropertyOptional({ description: 'Title', example: 'Professor' })
  @IsString()
  @IsOptional()
  title?: string;
}

export class UpdateInstructorDto {
  @ApiPropertyOptional({ description: 'Full name', example: 'Dr. John Smith' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ description: 'Department', example: 'Computer Science' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ description: 'Title', example: 'Professor' })
  @IsString()
  @IsOptional()
  title?: string;
}

