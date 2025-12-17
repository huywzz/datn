import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from '../../user/entities/student.entity';
import { ExchangeRequest } from './exchange-request.entity';

@Entity({ name: 'exchange_transactions' })
export class ExchangeTransaction {
  @PrimaryGeneratedColumn({ name: 'transaction_id' })
  transactionId: number;

  @Column({ name: 'student_id' })
  studentId: number;

  @Column({
    type: 'varchar',
    name: 'status',
    default: 'pending',
  })
  status: string; // pending, matched, completed, cancelled

  @Column({
    type: 'varchar',
    name: 'description',
    nullable: true,
  })
  description?: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Student, { nullable: false, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @OneToMany(() => ExchangeRequest, (item) => item.transaction, { cascade: true })
  items: ExchangeRequest[];
}

