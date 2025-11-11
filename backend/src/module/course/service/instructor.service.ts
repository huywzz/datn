import { Injectable } from '@nestjs/common';
import { Instructor } from '../entities/instructor.entity';
import { InstructorRepository } from '../repository/instructor.repository';
import { CreateInstructorDto } from '../dto/instructor.dto';

@Injectable()
export class InstructorService {
  constructor(
    private readonly instructorRepository: InstructorRepository,
  ) {}

  /**
   * Create a new instructor
   * @param createInstructorDto - Instructor data to create
   * @returns Created instructor
   */
  async create(createInstructorDto: CreateInstructorDto): Promise<Instructor> {
    const instructor = this.instructorRepository.create({
      fullName: createInstructorDto.fullName,
      department: createInstructorDto.department,
      title: createInstructorDto.title,
    });

    return await this.instructorRepository.save(instructor);
  }

  /**
   * Find all instructors
   * @returns List of instructors
   */
  async findAll(): Promise<Instructor[]> {
    return await this.instructorRepository.find();
  }

  /**
   * Find instructor by ID
   * @param instructorId - Instructor ID
   * @returns Instructor or null
   */
  async findOne(instructorId: number): Promise<Instructor | null> {
    return await this.instructorRepository.findOne({
      where: { instructorId },
      relations: ['sections'],
    });
  }
}

