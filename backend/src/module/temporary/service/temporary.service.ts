import { Injectable } from '@nestjs/common';
import { Temporary } from '../entities/temporary.entity';
import { TemporaryRepository } from '../repository/temporary.repository';
import { CreateTemporaryDto } from '../dto/temporary.dto';

@Injectable()
export class TemporaryService {
  constructor(
    private readonly temporaryRepository: TemporaryRepository,
  ) {}

  /**
   * Create a new temporary record
   * @param createTemporaryDto - Temporary data to create
   * @returns Created temporary record
   */
  async create(createTemporaryDto: CreateTemporaryDto): Promise<Temporary> {
    const temporary = this.temporaryRepository.create({
      courseId: createTemporaryDto.courseId,
      cohortId: createTemporaryDto.cohortId,
      status: createTemporaryDto.status || 'active',
    });

    return await this.temporaryRepository.save(temporary);
  }

  /**
   * Find all temporary records
   * @returns List of temporary records
   */
  async findAll(): Promise<Temporary[]> {
    return await this.temporaryRepository.find({
      relations: ['course', 'cohort'],
    });
  }

  /**
   * Find temporary record by ID
   * @param id - Temporary record ID
   * @returns Temporary record or null
   */
  async findOne(id: number): Promise<Temporary | null> {
    return await this.temporaryRepository.findOne({
      where: { id },
      relations: ['course', 'cohort'],
    });
  }

  /**
   * Find available courses for registration by cohort ID
   * @param cohortId - Cohort ID
   * @returns List of temporary records with course information
   */
  async findAvailableCoursesByCohortId(cohortId: string): Promise<Temporary[]> {
    const temporary = await this.temporaryRepository.find({
      where: {
        cohortId,
        status: 'active',
      },
      relations: ['course'],
    });

    return temporary;
  }
}

