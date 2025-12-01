import { Controller, Post, Get, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CourseService } from '../service/course.service';
import { CreateCourseDto } from '../dto/course.dto';
import { QueryCourseDto } from '../dto/course.dto';
import { Course } from '../entities/course.entity';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';

@ApiTags('courses')
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({ status: 201, description: 'Course created successfully', type: Course })
  async create(@Body() createCourseDto: CreateCourseDto): Promise<Course> {
    return await this.courseService.create(createCourseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses with pagination and search' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of courses',
    type: PaginatedResponseDto<Course>,
  })
  async findAll(@Query() queryDto: QueryCourseDto): Promise<PaginatedResponseDto<Course>> {
    const result = await this.courseService.findAll(queryDto);
    return new PaginatedResponseDto(result.data, result.total, result.page, result.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiResponse({ status: 200, description: 'Course found', type: Course })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Course | null> {
    return await this.courseService.findOne(id);
  }
}

