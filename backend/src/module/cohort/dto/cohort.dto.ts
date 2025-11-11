import { IsString, IsNotEmpty, IsInt, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCohortDto {
  @ApiProperty({ description: 'Cohort ID', example: '2021-2025' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Cohort code', example: 'COH2021' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Cohort name', example: 'Cohort 2021-2025' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Start year', example: 2021 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsNotEmpty()
  startYear: number;

  @ApiProperty({ description: 'End year', example: 2025 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsNotEmpty()
  endYear: number;
}

export class UpdateCohortDto {
  @ApiPropertyOptional({ description: 'Cohort code', example: 'COH2021' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: 'Cohort name', example: 'Cohort 2021-2025' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Start year', example: 2021 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  startYear?: number;

  @ApiPropertyOptional({ description: 'End year', example: 2025 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  endYear?: number;
}

