import { Injectable } from '@nestjs/common';
import { RedisProviderService } from '../../../provider/redis/redis-provider.service';
import { Redis } from 'ioredis';

/**
 * Service để quản lý queue các exchange transactions
 * Sử dụng Redis List để implement queue
 */
@Injectable()
export class ExchangeQueueService {
  private readonly redis: Redis;
  private readonly QUEUE_KEY = 'exchange:queue';
  private readonly PROCESSING_KEY = 'exchange:processing';

  constructor(redisService: RedisProviderService) {
    this.redis = redisService.getClient();
  }

  /**
   * Thêm transaction ID vào queue
   * @param transactionId - ID của transaction
   */
  async addToQueue(transactionId: number): Promise<void> {
    await this.redis.lpush(this.QUEUE_KEY, transactionId.toString());
  }

  /**
   * Lấy transaction ID từ queue (không xóa khỏi queue)
   * @returns Transaction ID hoặc null nếu queue rỗng
   */
  async peekFromQueue(): Promise<number | null> {
    const result = await this.redis.lindex(this.QUEUE_KEY, -1);
    return result ? parseInt(result, 10) : null;
  }

  /**
   * Lấy và xóa transaction ID từ queue
   * @returns Transaction ID hoặc null nếu queue rỗng
   */
  async popFromQueue(): Promise<number | null> {
    const result = await this.redis.rpop(this.QUEUE_KEY);
    return result ? parseInt(result, 10) : null;
  }

  /**
   * Lấy tất cả transaction IDs trong queue (không xóa)
   * @returns Danh sách transaction IDs
   */
  async getAllInQueue(): Promise<number[]> {
    const results = await this.redis.lrange(this.QUEUE_KEY, 0, -1);
    return results.map(id => parseInt(id, 10));
  }

  /**
   * Lấy transaction ID tại index cụ thể trong queue (không xóa)
   * @param index - Index trong queue (0 là phần tử mới nhất)
   * @returns Transaction ID hoặc null
   */
  async getAtIndex(index: number): Promise<number | null> {
    const result = await this.redis.lindex(this.QUEUE_KEY, index);
    return result ? parseInt(result, 10) : null;
  }

  /**
   * Xóa transaction ID khỏi queue
   * @param transactionId - ID của transaction cần xóa
   */
  async removeFromQueue(transactionId: number): Promise<void> {
    await this.redis.lrem(this.QUEUE_KEY, 0, transactionId.toString());
  }

  /**
   * Lấy số lượng transaction trong queue
   * @returns Số lượng transactions
   */
  async getQueueSize(): Promise<number> {
    return await this.redis.llen(this.QUEUE_KEY);
  }

  /**
   * Kiểm tra xem transaction có trong queue không
   * @param transactionId - ID của transaction
   * @returns true nếu có trong queue
   */
  async isInQueue(transactionId: number): Promise<boolean> {
    const allIds = await this.getAllInQueue();
    return allIds.includes(transactionId);
  }

  /**
   * Đánh dấu transaction đang được xử lý
   * @param transactionId - ID của transaction
   * @param ttlSeconds - Thời gian timeout (giây)
   */
  async markAsProcessing(transactionId: number, ttlSeconds: number = 300): Promise<void> {
    const key = `${this.PROCESSING_KEY}:${transactionId}`;
    await this.redis.setex(key, ttlSeconds, '1');
  }

  /**
   * Kiểm tra xem transaction có đang được xử lý không
   * @param transactionId - ID của transaction
   * @returns true nếu đang được xử lý
   */
  async isProcessing(transactionId: number): Promise<boolean> {
    const key = `${this.PROCESSING_KEY}:${transactionId}`;
    const result = await this.redis.get(key);
    return result !== null;
  }

  /**
   * Xóa đánh dấu đang xử lý
   * @param transactionId - ID của transaction
   */
  async unmarkAsProcessing(transactionId: number): Promise<void> {
    const key = `${this.PROCESSING_KEY}:${transactionId}`;
    await this.redis.del(key);
  }

  /**
   * Clear toàn bộ queue (dùng cho testing hoặc maintenance)
   */
  async clearQueue(): Promise<void> {
    await this.redis.del(this.QUEUE_KEY);
  }
}

