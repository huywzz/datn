import { Inject, Injectable } from '@nestjs/common';
import { Repository, FindOneOptions } from 'typeorm';
import { CourseSection } from '../entities/course-section.entity';
import { COURSE_SECTION_REPOSITORY } from 'src/common/constant/repository';
import { RedisProviderService } from '../../../provider/redis/redis-provider.service';
import Redis from 'ioredis';
import * as crypto from 'crypto';

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
   * Lấy số lượng sinh viên đã đăng ký từ Redis list
   * Key format: course-section:registered:students:{sectionId}
   */
  private async getRegisteredStudentCount(sectionId: number): Promise<number> {
    const listKey = `course-section:registered:students:${sectionId}`;
    const count = await this.redis.llen(listKey);
    return count;
  }

  /**
   * Override findOne với cache hỗ trợ đầy đủ FindOptions
   * Tự động lấy số lượng sinh viên đã đăng ký từ Redis và inject vào currentStudents
   */
  async findOne(options?: FindOneOptions<CourseSection>): Promise<CourseSection | null> {
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
}

