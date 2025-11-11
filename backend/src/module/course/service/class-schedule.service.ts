import { Injectable } from '@nestjs/common';
import { ClassSchedule } from '../entities/class-schedule.entity';
import { ClassScheduleRepository } from '../repository/class-schedule.repository';
import { CreateClassScheduleDto } from '../dto/class-schedule.dto';

@Injectable()
export class ClassScheduleService {
  constructor(
    private readonly classScheduleRepository: ClassScheduleRepository,
  ) {}

  /**
   * Create a new class schedule
   * @param createClassScheduleDto - Class schedule data to create
   * @returns Created class schedule
   */
  async create(createClassScheduleDto: CreateClassScheduleDto): Promise<ClassSchedule> {
    const schedule = this.classScheduleRepository.create({
      sectionId: createClassScheduleDto.sectionId,
      dayOfWeek: createClassScheduleDto.dayOfWeek,
      startPeriod: createClassScheduleDto.startPeriod,
      endPeriod: createClassScheduleDto.endPeriod,
      room: createClassScheduleDto.room,
    });

    return await this.classScheduleRepository.save(schedule);
  }

  /**
   * Find all class schedules
   * @returns List of class schedules
   */
  async findAll(): Promise<ClassSchedule[]> {
    return await this.classScheduleRepository.find({
      relations: ['section'],
    });
  }

  /**
   * Find class schedule by ID
   * @param scheduleId - Schedule ID
   * @returns Class schedule or null
   */
  async findOne(scheduleId: number): Promise<ClassSchedule | null> {
    return await this.classScheduleRepository.findOne({
      where: { scheduleId },
      relations: ['section'],
    });
  }
}

