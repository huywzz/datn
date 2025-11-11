import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { SemesterService } from '../service/semester.service';
import { SemesterStatus } from 'src/common/constant/enum';

@Controller('semesters')
export class SemesterController {
  constructor(private readonly semesterService: SemesterService) {}

  @Post()
  create(@Body() body: { startDate: string; endDate: string; status?: SemesterStatus }) {
    return this.semesterService.create({
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      status: body.status,
    });
  }

  @Get()
  findAll() {
    return this.semesterService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.semesterService.findOne(Number(id));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { startDate?: string; endDate?: string; status?: SemesterStatus },
  ) {
    return this.semesterService.update(Number(id), {
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      status: body.status,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.semesterService.softDelete(Number(id));
  }
}


