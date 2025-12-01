import { Injectable, BadRequestException } from '@nestjs/common';
import { Temporary } from '../entities/temporary.entity';
import { TemporaryRepository } from '../repository/temporary.repository';
import { CreateTemporaryDto } from '../dto/temporary.dto';
import { TemporaryImportRowDto } from '../dto/temporary-import.dto';
import * as XLSX from 'xlsx';
import { CourseRepository } from '../../course/repository/course.repository';
import { CohortRepository } from '../../cohort/repository/cohort.repository';
import { BaseException } from 'src/common/exceptions';

@Injectable()
export class TemporaryService {
  constructor(
    private readonly temporaryRepository: TemporaryRepository,
    private readonly courseRepository: CourseRepository,
    private readonly cohortRepository: CohortRepository,
  ) { }

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

  /**
   * Import temporary records from Excel file
   * @param file - Excel file buffer
   * @returns Object with success count and errors
   */
  async importFromExcel(file: Express.Multer.File): Promise<{ success: number; errors: string[] }> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const errors: string[] = [];
    let successCount = 0;

    try {
      // Read Excel file
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (rows.length === 0) {
        throw new BadRequestException('Excel file is empty');
      }

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2;

        try {
          const { data: parsedRow, errors: rowErrors } = TemporaryImportRowDto.fromExcelRow(row);
          if (!parsedRow) {
            rowErrors.forEach((message) => errors.push(`Row ${rowNumber}: ${message}`));
            continue;
          }

          // Find course by name
          const course = await this.courseRepository.findOne({ where: { name: parsedRow.courseName } });
          if (!course) {
            errors.push(`Row ${rowNumber}: Course "${parsedRow.courseName}" not found`);
            continue;
          }

          // Find cohort by name
          const cohort = await this.cohortRepository.findOne({ where: { name: parsedRow.cohortName } });
          if (!cohort) {
            errors.push(`Row ${rowNumber}: Cohort "${parsedRow.cohortName}" not found`);
            continue;
          }

          // Check if temporary record already exists
          const existingTemporary = await this.temporaryRepository.findOne({
            where: {
              courseId: course.courseId,
              cohortId: cohort.id,
            },
          });

          if (existingTemporary) {
            // Update status if needed or skip
            continue;
          }

          // Create new temporary record
          const temporary = this.temporaryRepository.create({
            courseId: course.courseId,
            cohortId: cohort.id,
            status: 'active',
          });

          await this.temporaryRepository.save(temporary);
          successCount++;
        } catch (error) {
          errors.push(`Row ${rowNumber}: ${error instanceof BaseException ? error.message : 'Unknown error'}`);
        }
      }

      return { success: successCount, errors };
    } catch (error) {
      throw new BadRequestException(
        `Failed to process Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

