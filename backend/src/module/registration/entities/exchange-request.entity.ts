import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from '../../user/entities/student.entity';
import { CourseSection } from '../../course/entities/course-section.entity';

@Entity({ name: 'exchange_requests' })
export class ExchangeRequest {
  @PrimaryGeneratedColumn({ name: 'exchange_id' })
  exchangeId: number;

  @Column({ name: 'requester_id' })
  requesterId: number;

  @Column({ name: 'from_section_id' })
  fromSectionId: number;

  @Column({ name: 'desired_section_id' })
  desiredSectionId: number;

  @Column({ name: 'accepter_id', nullable: true })
  accepterId: number;

  @Column({ type: 'varchar', name: 'status', default: 'pending' })
  status: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'datetime', name: 'matched_at', nullable: true })
  matchedAt: Date;

  @Column({ type: 'datetime', name: 'accepted_at', nullable: true })
  acceptedAt: Date;

  @Column({ type: 'datetime', name: 'completed_at', nullable: true })
  completedAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Student, { nullable: false, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'requester_id' })
  requester: Student;

  @ManyToOne(() => Student, { nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'accepter_id' })
  accepter: Student;

  @ManyToOne(() => CourseSection, (section) => section.fromExchangeRequests, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'from_section_id' })
  fromSection: CourseSection;

  @ManyToOne(() => CourseSection, (section) => section.desiredExchangeRequests, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'desired_section_id' })
  desiredSection: CourseSection;
}

