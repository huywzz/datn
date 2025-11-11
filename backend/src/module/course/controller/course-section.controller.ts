import { Controller, Post, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CourseSectionService } from '../service/course-section.service';
import { CreateCourseSectionDto } from '../dto/course-section.dto';
import { CourseSection } from '../entities/course-section.entity';

@ApiTags('course-sections')
@Controller('course-sections')
export class CourseSectionController {
  constructor(private readonly courseSectionService: CourseSectionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new course section' })
  @ApiResponse({ status: 201, description: 'Course section created successfully', type: CourseSection })
  async create(@Body() createCourseSectionDto: CreateCourseSectionDto): Promise<CourseSection> {
    return await this.courseSectionService.create(createCourseSectionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all course sections' })
  @ApiResponse({ status: 200, description: 'List of course sections', type: [CourseSection] })
  async findAll(): Promise<CourseSection[]> {
    return await this.courseSectionService.findAll();
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get course sections by course ID' })
  @ApiResponse({ status: 200, description: 'List of course sections for the course', type: [CourseSection] })
  async findByCourseId(@Param('courseId', ParseIntPipe) courseId: number): Promise<CourseSection[]> {
    return await this.courseSectionService.findByCourseId(courseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course section by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<CourseSection | null> {
    return await this.courseSectionService.findOne(id);
  }
}

