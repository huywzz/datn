import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CourseSection } from '../../course/entities/course-section.entity';
import { ExchangeTransaction } from './exchange-transaction.entity';
import { ExchangeAction } from '../../../common/constant/enum';
// export type ExchangeAction = 'ADD' | 'REMOVE';

@Entity({ name: 'exchange_requests' })
export class ExchangeRequest {
  @PrimaryGeneratedColumn({ name: 'exchange_id' })
  exchangeId: number;

  @Column({ name: 'transaction_id' })
  transactionId: number;

  @Column({ name: 'section_id' })
  sectionId: number;

  @Column({
    type: 'varchar',
    name: 'action',
  })
  action: ExchangeAction;

  @Column({
    type: 'varchar',
    name: 'note',
    nullable: true,
  })
  note?: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => ExchangeTransaction, (transaction) => transaction.items, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'transaction_id' })
  transaction: ExchangeTransaction;

  @ManyToOne(() => CourseSection, (section) => section.exchangeRequests, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'section_id' })
  section: CourseSection;
}

