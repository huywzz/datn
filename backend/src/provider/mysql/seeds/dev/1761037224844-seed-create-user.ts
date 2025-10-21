import { DataSource } from 'typeorm';

export class CreateUserSeed {
  public async up(dataSource: DataSource): Promise<void> {
    // TODO: Insert seed data here
  }

  public async down(dataSource: DataSource): Promise<void> {
    // TODO: Revert seed data here
  }
}
