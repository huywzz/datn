import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * MySQL Provider Service
 * Provides database connection and utility methods for MySQL operations
 */
@Injectable()
export class MysqlProviderService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get the database connection
   * @returns DataSource instance
   */
  getConnection(): DataSource {
    return this.dataSource;
  }

  /**
   * Check if database connection is established
   * @returns boolean
   */
  isConnected(): boolean {
    try {
      return this.dataSource.isInitialized;
    } catch {
      return false;
    }
  }

  /**
   * Execute raw SQL query
   * @param query - SQL query string
   * @param parameters - Query parameters
   * @returns Promise<unknown>
   */
  async executeQuery(query: string, parameters?: unknown[]): Promise<unknown> {
    return this.dataSource.query(query, parameters);
  }

  /**
   * Get database information
   * @returns Promise<Record<string, unknown>>
   */
  async getDatabaseInfo(): Promise<Record<string, unknown>> {
    const result: unknown[] = await this.dataSource.query(
      'SELECT DATABASE() as current_database',
    );
    return (result[0] as Record<string, unknown>) || {};
  }

  /**
   * Close database connection
   * @returns Promise<void>
   */
  async closeConnection(): Promise<void> {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }
  }
}
