import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CourseRegistrationPeriodRepository } from '../repository/course-registration-period.repository';
import {
  CreateCourseRegistrationPeriodDto,
  UpdateCourseRegistrationPeriodDto,
} from '../dto/course-registration-period.dto';
import { CourseRegistrationPeriod } from '../entities/course-registration-period.entity';

@Injectable()
export class CourseRegistrationPeriodService {
  constructor(private readonly periodRepository: CourseRegistrationPeriodRepository) {}

  private validateWindow(start?: string | Date, end?: string | Date): void {
    if (!start || !end) {
      if (start || end) {
        throw new ConflictException('Registration period requires both start and end time');
      }
      return;
    }

    const startDate = start instanceof Date ? start : new Date(start);
    const endDate = end instanceof Date ? end : new Date(end);
    const now = new Date();

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new ConflictException('Registration period times must be valid ISO strings');
    }

    if (endDate <= startDate) {
      throw new ConflictException('Registration end time must be after start time');
    }

    // Chỉ cho phép chọn khoảng thời gian ở tương lai
    if (startDate <= now || endDate <= now) {
      throw new ConflictException('Registration period must be in the future');
    }
  }

  async create(dto: CreateCourseRegistrationPeriodDto): Promise<CourseRegistrationPeriod> {
    this.validateWindow(dto.startTime, dto.endTime);

    // const existingPeriod = await this.periodRepository.findOne({ where: { status: true } });
    // if (existingPeriod) {
    //   throw new ConflictException('Active registration period already exists');
    // }
    const foundPeriod = await this.periodRepository.findOne({ where: { id:1 } });
    if (!foundPeriod) {
      throw new NotFoundException('Registration period not found');
    }
    foundPeriod.startTime = new Date(dto.startTime);
    foundPeriod.endTime = new Date(dto.endTime);
    foundPeriod.status = true;

    return await this.periodRepository.save(foundPeriod);
  }

  async findAll(): Promise<CourseRegistrationPeriod[]> {
    return await this.periodRepository.find({
      order: { startTime: 'DESC' },
    });
  }

  async findOne(id: number): Promise<CourseRegistrationPeriod> {
    id=1
    const period = await this.periodRepository.findOne({ where: { id } });
    if (!period) {
      throw new NotFoundException(`Registration period with ID ${id} not found`);
    }
    return period;
  }

  async update(
    id: number,
    dto: UpdateCourseRegistrationPeriodDto,
  ): Promise<CourseRegistrationPeriod> {
    const period = await this.findOne(id);

    const nextStart = dto.startTime ?? period.startTime;
    const nextEnd = dto.endTime ?? period.endTime;
    this.validateWindow(nextStart, nextEnd);

    if (dto.startTime !== undefined) {
      period.startTime = new Date(dto.startTime);
    }
    if (dto.endTime !== undefined) {
      period.endTime = new Date(dto.endTime);
    }

    return await this.periodRepository.save(period);
  }

  async remove(id: number): Promise<void> {
    const period = await this.findOne(id);
    await this.periodRepository.remove(period);
  }
}

