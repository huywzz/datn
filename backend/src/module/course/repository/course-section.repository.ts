import { Inject, Injectable } from '@nestjs/common';
import { Repository, FindOneOptions } from 'typeorm';
import { CourseSection } from '../entities/course-section.entity';
import { COURSE_SECTION_REPOSITORY } from 'src/common/constant/repository';
import { RedisProviderService } from '../../../provider/redis/redis-provider.service';
import Redis from 'ioredis';
import * as crypto from 'crypto';

interface FindOneWithCacheOptions extends FindOneOptions<CourseSection> {
  isCache?: boolean;
}

@Injectable()
export class CourseSectionRepository extends Repository<CourseSection> {
  private redis: Redis;

  constructor(
    @Inject(COURSE_SECTION_REPOSITORY) private courseSectionRepository: Repository<CourseSection>,
    redisService: RedisProviderService,
  ) {
    super(courseSectionRepository.target, courseSectionRepository.manager, courseSectionRepository.queryRunner);
    this.redis = redisService.getClient();
  }

  /**
   * Tạo cache key từ FindOptions
   * Tương tự như StudentRepository
   */
  private generateCacheKey(options?: FindOneOptions<CourseSection>): string {
    if (!options) {
      return 'course-section:default';
    }

    // Kiểm tra nếu query chỉ có where: { sectionId: number } và không có options khác
    const hasOnlySectionIdWhere =
      options.where &&
      typeof options.where === 'object' &&
      !Array.isArray(options.where) &&
      Object.keys(options.where).length === 1 &&
      'sectionId' in options.where &&
      typeof (options.where as any).sectionId === 'number' &&
      !options.relations &&
      !options.select &&
      !options.order &&
      !options.withDeleted &&
      !options.loadEagerRelations &&
      !options.loadRelationIds &&
      !options.cache;

    if (hasOnlySectionIdWhere) {
      const sectionId = (options.where as any).sectionId;
      return `course-section:query:get/${sectionId}`;
    }

    // Serialize options thành JSON và hash để tạo key ngắn gọn
    const optionsStr = JSON.stringify(options, (key, value) => {
      // Sắp xếp keys để đảm bảo cùng options tạo cùng key
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return Object.keys(value).sort().reduce((sorted, k) => {
          sorted[k] = value[k];
          return sorted;
        }, {} as any);
      }
      return value;
    });

    const hash = crypto.createHash('md5').update(optionsStr).digest('hex');
    return `course-section:query:${hash}`;
  }

  /**
   * Lấy số lượng sinh viên đã đăng ký từ Redis set
   * Key format: course-section:registered:students:{sectionId}
   */
  private async getRegisteredStudentCount(sectionId: number): Promise<number> {
    const setKey = `course-section:registered:students:${sectionId}`;
    const count = await this.redis.scard(setKey);
    return count;
  }

  /**
   * Lấy course section đã được sinh viên đăng ký theo courseId từ Redis hash
   * Hash key: registration:student:{studentId}:semester:{semesterId}:courses
   * Field: courseId, Value: CourseSection (JSON)
   */
  async findRegisteredCourseSectionByCourseIdFromCache(
    studentId: number,
    semesterId: number,
    courseId: number,
  ): Promise<CourseSection | null> {
    const hashKey = `registration:student:${studentId}:semester:${semesterId}:courses`;
    const cached = await this.redis.hget(hashKey, courseId.toString());

    if (!cached) return null;

    return JSON.parse(cached) as CourseSection;
  }

  /**
   * Lấy tất cả CourseSection mà sinh viên đã đăng ký trong một học kỳ từ Redis hash
   * Hash key: registration:student:{studentId}:semester:{semesterId}:courses
   * @returns Danh sách CourseSection (có thể rỗng nếu chưa đăng ký gì)
   */
  async getStudentRegisteredSectionsFromCache(
    studentId: number,
    semesterId: number,
  ): Promise<CourseSection[]> {
    const hashKey = `registration:student:${studentId}:semester:${semesterId}:courses`;
    const values = await this.redis.hvals(hashKey);

    if (!values || values.length === 0) {
      return [];
    }

    return values
      .map((raw) => {
        try {
          return JSON.parse(raw) as CourseSection;
        } catch {
          return null;
        }
      })
      .filter((section): section is CourseSection => !!section);
  }

  /**
   * Override findOne với cache hỗ trợ đầy đủ FindOptions
   * Tự động lấy số lượng sinh viên đã đăng ký từ Redis và inject vào currentStudents
   */
  async findOne(options?: FindOneWithCacheOptions): Promise<CourseSection | null> {
    if (!(options?.isCache ?? true)) {
      return await super.findOne(options ?? {});
    }

    const cacheKey = this.generateCacheKey(options);

    // 1️⃣ Check cache
    const cached = await this.redis.get(cacheKey);
    let courseSection: CourseSection | null;
    
    if (cached) {
      courseSection = JSON.parse(cached) as CourseSection;
    } else {
      // 2️⃣ Query DB
      courseSection = await super.findOne(options ?? {});
      if (!courseSection) return null;

      // 3️⃣ Lưu vào Redis với TTL 60s
      await this.redis.set(cacheKey, JSON.stringify(courseSection), 'EX', 60);
    }

    // 4️⃣ Lấy số lượng sinh viên đã đăng ký từ Redis list và inject vào currentStudents
    // Chỉ thực hiện khi có sectionId
    if (courseSection?.sectionId) {
      const registeredCount = await this.getRegisteredStudentCount(courseSection.sectionId);
      courseSection.currentStudents = registeredCount;
    }

    return courseSection;
  }

  /**
   * Kiểm tra hai CourseSection có bị trùng lịch hay không
   */
  static hasScheduleConflictBetweenSections(
    a: CourseSection,
    b: CourseSection,
  ): boolean {
    if (!a.classSchedules || !b.classSchedules) return false;
    if (a.classSchedules.length === 0 || b.classSchedules.length === 0) return false;

    for (const sa of a.classSchedules) {
      for (const sb of b.classSchedules) {
        // Cùng thứ
        if (sa.dayOfWeek !== sb.dayOfWeek) continue;

        // Chồng chéo tiết: [sa.start, sa.end] overlap [sb.start, sb.end]
        const isOverlap =
          sa.startPeriod <= sb.endPeriod &&
          sa.endPeriod >= sb.startPeriod;

        if (isOverlap) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Kiểm tra xung đột lịch giữa 2 section với cache Redis
   * - Key: course-section:conflict:{minId}:{maxId}
   * - Value: '1' | '0'
   */
  async hasScheduleConflict(
    a: CourseSection,
    b: CourseSection,
  ): Promise<boolean> {
    const aId = Math.min(a.sectionId, b.sectionId);
    const bId = Math.max(a.sectionId, b.sectionId);

    const cacheKey = `course-section:conflict:${aId}:${bId}`;

    // 1️⃣ Check cache
    const cached = await this.redis.get(cacheKey);
    if (cached === '1') return true;
    if (cached === '0') return false;

    // 2️⃣ Đảm bảo đã load classSchedules cho cả hai section (nếu chưa có)
    let sectionA = a;
    let sectionB = b;

    if (!sectionA.classSchedules || sectionA.classSchedules.length === 0) {
      const loadedA = await this.findOne({
        where: { sectionId: a.sectionId },
        relations: { classSchedules: true },
      });
      if (loadedA) {
        sectionA = loadedA;
      }
    }

    if (!sectionB.classSchedules || sectionB.classSchedules.length === 0) {
      const loadedB = await this.findOne({
        where: { sectionId: b.sectionId },
        relations: { classSchedules: true },
      });
      if (loadedB) {
        sectionB = loadedB;
      }
    }

    // Nếu sau khi cố load mà vẫn thiếu schedules, coi như không có xung đột
    if (
      !sectionA.classSchedules ||
      sectionA.classSchedules.length === 0 ||
      !sectionB.classSchedules ||
      sectionB.classSchedules.length === 0
    ) {
      await this.redis.set(cacheKey, '0', 'EX', 600);
      return false;
    }

    // 3️⃣ Tính toán thật bằng hàm static
    const hasConflict = CourseSectionRepository.hasScheduleConflictBetweenSections(
      sectionA,
      sectionB,
    );

    // 4️⃣ Lưu cache với TTL 10 phút
    await this.redis.set(cacheKey, hasConflict ? '1' : '0', 'EX', 600);

    return hasConflict;
  }
}

