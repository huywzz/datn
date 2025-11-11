import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Temporary } from '../entities/temporary.entity';
import { TEMPORARY_REPOSITORY } from 'src/common/constant/repository';

@Injectable()
export class TemporaryRepository extends Repository<Temporary> {
  constructor(@Inject(TEMPORARY_REPOSITORY) private temporaryRepository: Repository<Temporary>) {
    super(temporaryRepository.target, temporaryRepository.manager, temporaryRepository.queryRunner);
  }

  /**
   * Get available courses for registration by cohort ID using raw SQL
   * @param cohortId - Cohort ID
   * @returns List of temporary records with course and cohort information
   */
  async findAvailableCoursesByCohortIdRaw(cohortId: string): Promise<Temporary[]> {
    const query = `
      SELECT 
        t.id,
        t.course_id as courseId,
        t.cohort_id as cohortId,
        t.status,
        t.created_at as createdAt,
        t.updated_at as updatedAt,
        c.course_id as course_courseId,
        c.code as course_code,
        c.name as course_name,
        c.credits as course_credits,
        c.created_at as course_createdAt,
        c.updated_at as course_updatedAt,
        ch.id as cohort_id,
        ch.code as cohort_code,
        ch.name as cohort_name,
        ch.start_year as cohort_startYear,
        ch.end_year as cohort_endYear,
        ch.created_at as cohort_createdAt,
        ch.updated_at as cohort_updatedAt
      FROM temporaries t
      INNER JOIN courses c ON t.course_id = c.course_id
      INNER JOIN cohorts ch ON t.cohort_id = ch.id
      WHERE t.cohort_id = ?
        AND t.status = 'active'
      ORDER BY c.code ASC
    `;

    const results = await this.manager.query(query, [cohortId]);

    // Map raw SQL results to Temporary entities with relations
    return results.map((row: any) => {
      const temporary = new Temporary();
      temporary.id = row.id;
      temporary.courseId = row.courseId;
      temporary.cohortId = row.cohortId;
      temporary.status = row.status;
      temporary.createdAt = row.createdAt;
      temporary.updatedAt = row.updatedAt;

      // Map course relation
      if (row.course_courseId) {
        temporary.course = {
          courseId: row.course_courseId,
          code: row.course_code,
          name: row.course_name,
          credits: row.course_credits,
          createdAt: row.course_createdAt,
          updatedAt: row.course_updatedAt,
        } as any;
      }

      // Map cohort relation
      if (row.cohort_id) {
        temporary.cohort = {
          id: row.cohort_id,
          code: row.cohort_code,
          name: row.cohort_name,
          startYear: row.cohort_startYear,
          endYear: row.cohort_endYear,
          createdAt: row.cohort_createdAt,
          updatedAt: row.cohort_updatedAt,
        } as any;
      }

      return temporary;
    });
  }
}

