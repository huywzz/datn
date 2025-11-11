import { Controller, Post, Get, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RegistrationService } from '../service/registration.service';
import { CreateRegistrationDto } from '../dto/registration.dto';
import { Registration } from '../entities/registration.entity';
import { SWAGGER_JWT } from 'src/common/constant/global';
import { JwtAuthGuard } from 'src/module/auth/guard/jwt.guard';
import { User } from 'src/module/user/entities/user.entity';
import { CurrentUser } from 'src/module/auth/decorator/user.decorator';

@ApiTags('registrations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth(SWAGGER_JWT)
@Controller('registrations')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new registration' })
  async create(@Body() createRegistrationDto: CreateRegistrationDto, @CurrentUser() user:User) {
    // return user;
    return await this.registrationService.create(createRegistrationDto,user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all registrations' })
  @ApiResponse({ status: 200, description: 'List of registrations', type: [Registration] })
  async findAll(): Promise<Registration[]> {
    return await this.registrationService.findAll();
  }

  @Get('my-schedule')
  @ApiOperation({ summary: 'Get class schedule for current student' })
  @ApiResponse({ status: 200, description: 'Student class schedule' })
  async getMySchedule(@CurrentUser() user: User) {
    return await this.registrationService.getMySchedule(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get registration by ID' })
  @ApiResponse({ status: 200, description: 'Registration found', type: Registration })
  @ApiResponse({ status: 404, description: 'Registration not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.registrationService.findOne(id);
  }
}

