import { Injectable } from '@nestjs/common';
import { RegistrationRepository } from '../repository/registration.repository';
import { CourseSectionRepository } from 'src/module/course/repository/course-section.repository';
import { StudentRepository } from 'src/module/user/repository/student.repository';
import { Registration } from '../entities/registration.entity';
import { CourseSection } from 'src/module/course/entities/course-section.entity';
import { Student } from 'src/module/user/entities/student.entity';
import { RedisProviderService } from 'src/provider/redis/redis-provider.service';
import Redis from 'ioredis';

@Injectable()
export class SyncRegistrationService {
  private readonly redis: Redis;

  constructor(
    private readonly registrationRepository: RegistrationRepository,
    private readonly courseSectionRepository: CourseSectionRepository,
    private readonly studentRepository: StudentRepository,
    redisService: RedisProviderService,
  ) {
    this.redis = redisService.getClient();
  }

  /**
   * Quét Redis để lấy tất cả key:
   *   course-section:registered:students:{sectionId}
   * rồi sync xuống bảng registrations.
   *
   * Đồng thời cũng quét DB để lấy tất cả sections có registrations,
   * đảm bảo sync cả 2 chiều: Redis -> DB và DB -> Redis (xóa nếu Redis không có)
   *
   * Trả về danh sách kết quả theo từng sectionId:
   *   { sectionId, createdCount, removedCount }
   */
  async syncAllFromRedis(): Promise<
    { sectionId: number; createdCount: number; removedCount: number }[]
  > {
    const pattern = 'course-section:registered:students:*';
    const sectionIdsFromRedis = await this.scanSectionIds(pattern);

    // Lấy tất cả sectionId có registrations trong DB (distinct)
    const registrationsInDb = await this.registrationRepository
      .createQueryBuilder('reg')
      .select('DISTINCT reg.sectionId', 'sectionId')
      .getRawMany<{ sectionId: number }>();

    const sectionIdsFromDb = registrationsInDb
      .map((r) => r.sectionId)
      .filter((id): id is number => Number.isFinite(id));

    // Merge 2 tập: sectionId từ Redis và từ DB (union)
    const allSectionIds = new Set<number>([
      ...sectionIdsFromRedis,
      ...sectionIdsFromDb,
    ]);

    const results: {
      sectionId: number;
      createdCount: number;
      removedCount: number;
    }[] = [];

    for (const sectionId of allSectionIds) {
      const { createdCount, removedCount } = await this.syncSection(sectionId);
      results.push({ sectionId, createdCount, removedCount });
    }

    return results;
  }

  /**
   * Sync registrations cho một section cụ thể dựa trên set Redis:
   *   course-section:registered:students:{sectionId}
   *
   * Các bước:
   * 1. Lấy toàn bộ studentId từ Redis set (studentIdRedis)
   * 2. Lấy toàn bộ registrations hiện có trong DB cho section đó (studentIdDb)
   * 3. Tính:
   *    - toAdd = studentIdRedis - studentIdDb  (cần tạo mới)
   *    - toRemove = studentIdDb - studentIdRedis (cần soft delete)
   *
   * Trả về: số lượng registrations được tạo mới và bị xóa.
   */
  async syncSection(
    sectionId: number,
  ): Promise<{ createdCount: number; removedCount: number }> {
    // Lấy section từ DB (có thể dùng cache của repository)
    const section: CourseSection | null =
      await this.courseSectionRepository.findOne({
        where: { sectionId },
      });

    if (!section) {
      // Nếu section không tồn tại trong DB thì bỏ qua
      return { createdCount: 0, removedCount: 0 };
    }

    const setKey = `course-section:registered:students:${sectionId}`;
    const [memberIds, existingRegistrations] = await Promise.all([
      this.redis.smembers(setKey),
      this.registrationRepository.find({
        select: ['registrationId', 'studentId'],
        where: { sectionId: section.sectionId },
      }),
    ]);

    if (
      (!memberIds || memberIds.length === 0) &&
      existingRegistrations.length === 0
    ) {
      return { createdCount: 0, removedCount: 0 };
    }

    // Tập studentId trong Redis
    const studentIdRedis = new Set<number>();
    for (const member of memberIds) {
      const id = Number(member);
      if (Number.isFinite(id)) {
        studentIdRedis.add(id);
      }
    }

    // Tập studentId trong DB
    const studentIdDb = new Set<number>(
      existingRegistrations.map((reg) => reg.studentId),
    );

    // Những studentId chỉ có ở Redis (cần thêm)
    const toAddIds = [...studentIdRedis].filter((id) => !studentIdDb.has(id));

    // Những registration chỉ có ở DB (không còn trong Redis, cần xóa)
    const toRemoveRegs = existingRegistrations.filter(
      (reg) => !studentIdRedis.has(reg.studentId),
    );

    // Soft delete các registrations thừa trong DB
    let removedCount = 0;
    if (toRemoveRegs.length > 0) {
      const registrationIds = toRemoveRegs.map((reg) => reg.registrationId);
      await this.registrationRepository.softDelete(registrationIds);
      removedCount = toRemoveRegs.length;
    }

    let createdCount = 0;

    // Tạo registrations mới cho các studentId chỉ có ở Redis
    for (const studentId of toAddIds) {
      // Lấy thông tin student để xác định semester nếu cần
      const student: Student | null = await this.studentRepository.findOne({
        where: { id: studentId },
      });

      // Ưu tiên dùng semesterId của section, fallback sang currentSemester của student
      const semester =
        section.semesterId ??
        student?.currentSemester ??
        0; // 0: fallback, tùy bạn muốn xử lý thế nào

      const registration = this.registrationRepository.create({
        studentId,
        sectionId: section.sectionId,
        registeredAt: new Date(),
        status: 'active',
        semester,
      } as Partial<Registration>);

      await this.registrationRepository.save(registration);
      createdCount++;
    }

    // Cập nhật lại currentStudents của section cho khớp với dữ liệu Redis
    // Sử dụng kích thước tập studentIdRedis (đã lọc các id không hợp lệ)
    await this.courseSectionRepository.update(
      { sectionId: section.sectionId },
      { currentStudents: studentIdRedis.size },
    );

    return { createdCount, removedCount };
  }

  /**
   * Dùng SCAN để lấy tất cả sectionId từ pattern:
   *   course-section:registered:students:{sectionId}
   */
  private async scanSectionIds(pattern: string): Promise<number[]> {
    let cursor = '0';
    const ids = new Set<number>();

    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );

      cursor = nextCursor;

      for (const key of keys) {
        const parts = key.split(':');
        const sectionIdStr = parts[parts.length - 1];
        const sectionId = Number(sectionIdStr);

        if (Number.isFinite(sectionId)) {
          ids.add(sectionId);
        }
      }
    } while (cursor !== '0');

    return Array.from(ids);
  }
}


