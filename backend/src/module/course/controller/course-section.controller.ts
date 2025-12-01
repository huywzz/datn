import { Controller, Post, Get, Body, Param, ParseIntPipe, UseInterceptors, UploadedFile, BadRequestException, Query, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CourseSectionService } from '../service/course-section.service';
import { CreateCourseSectionDto } from '../dto/course-section.dto';
import { SearchCourseSectionDto, QueryCourseSectionByCourseIdDto, QueryStudentsBySectionDto } from '../dto/query-course-section.dto';
import { CourseSection } from '../entities/course-section.entity';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { JwtAuthGuard } from 'src/module/auth/guard/jwt.guard';
import { CurrentUser } from 'src/module/auth/decorator/user.decorator';
import { User } from 'src/module/user/entities/user.entity';
import { SWAGGER_JWT } from 'src/common/constant/global';

@ApiTags('course-sections')
@Controller('course-sections')
export class CourseSectionController {
  constructor(private readonly courseSectionService: CourseSectionService) { }

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

  @Get('search')
  @ApiOperation({ summary: 'Search and filter course sections with pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'Paginated list of filtered course sections',
    type: PaginatedResponseDto<CourseSection>
  })
  async search(@Query() searchDto: SearchCourseSectionDto): Promise<PaginatedResponseDto<CourseSection>> {
    const result = await this.courseSectionService.searchCourseSections(searchDto);
    return new PaginatedResponseDto(result.data, result.total, result.page, result.limit);
  }

  @Get('course/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth(SWAGGER_JWT)
  @ApiOperation({ summary: 'Get course sections by course ID with pagination and optional semester filter' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of course sections for the course',
    type: PaginatedResponseDto<CourseSection>,
  })
  async findByCourseId(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Query() queryDto: QueryCourseSectionByCourseIdDto,
    @CurrentUser() user: User,
  ): Promise<PaginatedResponseDto<CourseSection>> {
    const result = await this.courseSectionService.findByCourseId(courseId, queryDto, user);
    return new PaginatedResponseDto(result.data, result.total, result.page, result.limit);
  }

  @Get(':id/students')
  @ApiOperation({ summary: 'Get all students in a course section with pagination and search' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of students registered in the section',
    type: PaginatedResponseDto,
  })
  async getStudents(
    @Param('id', ParseIntPipe) id: number,
    @Query() queryDto: QueryStudentsBySectionDto,
  ): Promise<PaginatedResponseDto<any>> {
    const result = await this.courseSectionService.getStudentsBySection(id, queryDto);
    return new PaginatedResponseDto(result.data, result.total, result.page, result.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course section by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<CourseSection | null> {
    return await this.courseSectionService.findOne(id);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import course sections from Excel file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Excel file with course sections data',
        },
        semesterId: {
          type: 'number',
          description: 'Semester ID',
          example: 1,
        },
        cohortId: {
          type: 'string',
          description: 'Cohort ID for temporary records',
          example: '2021-2025',
        },
      },
      required: ['file', 'semesterId', 'cohortId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Import completed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file or data' })
  async importFromExcel(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { semesterId: string; cohortId: string },
  ): Promise<{ success: number; errors: string[] }> {
    const semesterId = parseInt(body.semesterId, 10);
    if (isNaN(semesterId)) {
      throw new BadRequestException('semesterId must be a valid number');
    }
    if (!body.cohortId || typeof body.cohortId !== 'string') {
      throw new BadRequestException('cohortId is required and must be a string');
    }
    return await this.courseSectionService.importFromExcel(file, semesterId, body.cohortId);
  }
}

