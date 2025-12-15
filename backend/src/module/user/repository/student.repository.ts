import {Inject, Injectable} from '@nestjs/common';
import {Repository, FindOneOptions} from 'typeorm';
import {Student} from '../entities/student.entity';
import {STUDENT_REPOSITORY} from 'src/common/constant/repository';
import {RedisProviderService} from '../../../provider/redis/redis-provider.service';
import Redis from "ioredis";
import * as crypto from 'crypto';

@Injectable()
export class StudentRepository extends Repository<Student> {
    private redis: Redis;

    constructor(@Inject(STUDENT_REPOSITORY) private studentRepository: Repository<Student>,
                redisService: RedisProviderService) {
        super(studentRepository.target, studentRepository.manager, studentRepository.queryRunner);
        this.redis = redisService.getClient();
    }

    /**
     * Tạo cache key từ FindOptions
     * Nếu query chỉ có where: { id } thì dùng key đơn giản, ngược lại dùng hash
     */
    private generateCacheKey(options?: FindOneOptions<Student>): string {
        if (!options) {
            return 'student:default';
        }

        // Kiểm tra nếu query chỉ có where: { id: number } và không có options khác
        const hasOnlyIdWhere = 
            options.where &&
            typeof options.where === 'object' &&
            !Array.isArray(options.where) &&
            Object.keys(options.where).length === 1 &&
            'id' in options.where &&
            typeof (options.where as any).id === 'number' &&
            !options.relations &&
            !options.select &&
            !options.order &&
            !options.withDeleted &&
            !options.loadEagerRelations &&
            !options.loadRelationIds &&
            !options.cache;

        if (hasOnlyIdWhere) {
            const id = (options.where as any).id;
            return `student:query:get/${id}`;
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
        return `student:query:${hash}`;
    }

    /**
     * Override findOne với cache hỗ trợ đầy đủ FindOptions
     */
    async findOne(options?: FindOneOptions<Student>): Promise<Student | null> {
        const cacheKey = this.generateCacheKey(options);

        // 1️⃣ Check cache
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached) as Student;
        }

        // 2️⃣ Query DB
        const student = await super.findOne(options ?? {});
        if (!student) return null;

        // 3️⃣ Lưu vào Redis với TTL 60s
        await this.redis.set(cacheKey, JSON.stringify(student), 'EX', 60);

        return student;
    }

    /**
     * Tìm student theo ID (giữ lại để tương thích ngược)
     * Sử dụng findOne bên trong để tận dụng cache
     */
    async findById(id: number): Promise<Student | null> {
        return this.findOne({where: {id: id}});
    }
}

