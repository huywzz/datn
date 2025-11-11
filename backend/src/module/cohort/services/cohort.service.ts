import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CohortRepository } from '../repository/cohort.repository';
import { Cohort } from '../entities/cohort.entity';
import { CreateCohortDto, UpdateCohortDto } from '../dto/cohort.dto';

@Injectable()
export class CohortService {
  constructor(private readonly cohortRepository: CohortRepository) {}

  /**
   * Create a new cohort
   * @param createCohortDto - Cohort data to create
   * @returns Created cohort
   */
  async create(createCohortDto: CreateCohortDto): Promise<Cohort> {
    // Check if cohort with id already exists
    const existingCohort = await this.cohortRepository.findOne({
      where: { id: createCohortDto.id },
    });

    if (existingCohort) {
      throw new ConflictException('Cohort with this ID already exists');
    }

    // Validate that end year is after start year
    if (createCohortDto.endYear <= createCohortDto.startYear) {
      throw new ConflictException('End year must be after start year');
    }

    // Create new cohort
    const cohort = this.cohortRepository.create({
      id: createCohortDto.id,
      code: createCohortDto.code,
      name: createCohortDto.name,
      startYear: createCohortDto.startYear,
      endYear: createCohortDto.endYear,
    });

    return await this.cohortRepository.save(cohort);
  }

  /**
   * Get all cohorts
   * @returns List of all cohorts
   */
  async findAll(): Promise<Cohort[]> {
    return await this.cohortRepository.find({
      order: { startYear: 'DESC' },
    });
  }

  /**
   * Get cohort by ID
   * @param id - Cohort ID
   * @returns Cohort
   */
  async findOne(id: string): Promise<Cohort> {
    const cohort = await this.cohortRepository.findOne({
      where: { id },
      relations: ['students'],
    });

    if (!cohort) {
      throw new NotFoundException(`Cohort with ID ${id} not found`);
    }

    return cohort;
  }

  /**
   * Update cohort
   * @param id - Cohort ID
   * @param updateCohortDto - Cohort data to update
   * @returns Updated cohort
   */
  async update(id: string, updateCohortDto: UpdateCohortDto): Promise<Cohort> {
    const cohort = await this.findOne(id);
    // Update cohort fields
    Object.assign(cohort, updateCohortDto);

    return await this.cohortRepository.save(cohort);
  }

  /**
   * Delete cohort
   * @param id - Cohort ID
   * @returns void
   */
  async remove(id: string): Promise<void> {
    const cohort = await this.findOne(id);
    await this.cohortRepository.remove(cohort);
  }
}

