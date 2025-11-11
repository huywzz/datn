import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CourseSection } from './course-section.entity';

@Entity({ name: 'class_schedules' })
export class ClassSchedule {
  @PrimaryGeneratedColumn({ name: 'schedule_id' })
  scheduleId: number;

  @Column({ name: 'section_id' })
  sectionId: number;

  @Column({ type: 'varchar', name: 'day_of_week' })
  dayOfWeek: string;

  @Column({ type: 'integer', name: 'start_period' })
  startPeriod: number;

  @Column({ type: 'integer', name: 'end_period' })
  endPeriod: number;

  @Column({ type: 'varchar', name: 'room', nullable: true })
  room: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => CourseSection, (section) => section.classSchedules, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'section_id' })
  section: CourseSection;
}

