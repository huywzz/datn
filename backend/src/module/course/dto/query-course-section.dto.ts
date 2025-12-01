import { IsInt, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CourseSectionStatus } from 'src/common/constant/enum';
import { BasePaginationQueryDto } from 'src/common/dto/base-pagination-query.dto';

export class SearchCourseSectionDto extends BasePaginationQueryDto {
    @ApiPropertyOptional({
        description: 'Filter by course ID',
        example: 1
    })
    @IsInt()
    @IsOptional()
    @Type(() => Number)
    courseId?: number;

    @ApiPropertyOptional({
        description: 'Filter by instructor ID',
        example: 1
    })
    @IsInt()
    @IsOptional()
    @Type(() => Number)
    instructorId?: number;

    @ApiPropertyOptional({
        description: 'Filter by status',
        enum: CourseSectionStatus,
        example: CourseSectionStatus.OPEN
    })
    @IsEnum(CourseSectionStatus)
    @IsOptional()
    status?: CourseSectionStatus;

    @ApiPropertyOptional({
        description: 'Filter by semester ID',
        example: 1
    })
    @IsInt()
    @IsOptional()
    @Type(() => Number)
    semesterId?: number;
}

/**
 * Query DTO for filtering course sections by course ID with pagination
 */
export class QueryCourseSectionByCourseIdDto extends BasePaginationQueryDto {
    @ApiPropertyOptional({
        description: 'Filter by semester ID',
        example: 1
    })
    @IsInt()
    @IsOptional()
    @Type(() => Number)
    semesterId?: number;
}

/**
 * Query DTO for filtering students by course section with pagination
 * Search by student name, student code, class code, or major
 */
export class QueryStudentsBySectionDto extends BasePaginationQueryDto {
  // Inherits all pagination fields from BasePaginationQueryDto:
  // - search: string (for searching by student name, student code, class code, or major)
  // - page: number
  // - limit: number
  // - sortBy: string
  // - sortOrder: SortOrder (ASC | DESC)
}