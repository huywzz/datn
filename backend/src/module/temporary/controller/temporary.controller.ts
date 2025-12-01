import { Controller, Post, Get, Body, Param, ParseIntPipe, UseGuards, NotFoundException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { TemporaryService } from '../service/temporary.service';
import { CreateTemporaryDto } from '../dto/temporary.dto';
import { Temporary } from '../entities/temporary.entity';
import { CurrentUser } from '../../auth/decorator/user.decorator';
import { User } from '../../user/entities/user.entity';
import { JwtAuthGuard } from '../../auth/guard/jwt.guard';
import { UserRepository } from '../../user/repository/user.repository';
import { SWAGGER_JWT } from 'src/common/constant/global';

@ApiTags('temporaries')
@Controller('temporaries')
export class TemporaryController {
  constructor(
    private readonly temporaryService: TemporaryService,
    private readonly userRepository: UserRepository,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create a new temporary record' })
  @ApiResponse({ status: 201, description: 'Temporary record created successfully', type: Temporary })
  async create(@Body() createTemporaryDto: CreateTemporaryDto): Promise<Temporary> {
    return await this.temporaryService.create(createTemporaryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all temporary records' })
  @ApiResponse({ status: 200, description: 'List of temporary records', type: [Temporary] })
  async findAll(): Promise<Temporary[]> {
    return await this.temporaryService.findAll();
  }

  @Get('available-courses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth(SWAGGER_JWT)
  @ApiOperation({ summary: 'Get available courses for registration based on user cohort' })
  @ApiResponse({ status: 200, description: 'List of available courses', type: [Temporary] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User student information not found' })
  async getAvailableCourses(@CurrentUser() user: User): Promise<Temporary[]> {
    // Load user with student relation to get cohortId
    const userWithStudent = await this.userRepository.findOne({
      where: { userId: user.userId },
      relations: ['student'],
    });

    if (!userWithStudent || !userWithStudent.student) {
      throw new NotFoundException('Student information not found for this user');
    }

    const cohortId = userWithStudent.student.cohortId;
    return await this.temporaryService.findAvailableCoursesByCohortId(cohortId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get temporary record by ID' })
  @ApiResponse({ status: 200, description: 'Temporary record found', type: Temporary })
  @ApiResponse({ status: 404, description: 'Temporary record not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Temporary | null> {
    return await this.temporaryService.findOne(id);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import temporary records from Excel file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Excel file with temporary data',
        },
        registrationStartDate: {
          type: 'string',
          format: 'date-time',
          description: 'Registration Start Date',
          example: '2024-01-01T00:00:00Z',
        },
        registrationEndDate: {
          type: 'string',
          format: 'date-time',
          description: 'Registration End Date',
          example: '2024-01-15T23:59:59Z',
        },
      },
      required: ['file', 'registrationStartDate', 'registrationEndDate'],
    },
  })
  @ApiResponse({ status: 200, description: 'Import completed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file or data' })
  async importFromExcel(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { registrationStartDate: string; registrationEndDate: string },
  ): Promise<{ success: number; errors: string[] }> {
    // Note: registrationStartDate and registrationEndDate are accepted but not currently stored
    // as per user instruction to only focus on temporary table import.
    return await this.temporaryService.importFromExcel(file);
  }
}

