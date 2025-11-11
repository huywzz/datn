import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Course } from '../../course/entities/course.entity';
import { Cohort } from '../../cohort/entities/cohort.entity';

@Entity({ name: 'temporaries' })
export class Temporary {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'course_id' })
  courseId: number;

  @Column({ name: 'cohort_id', type: 'varchar' })
  cohortId: string;

  @Column({ type: 'varchar', name: 'status', default: 'active' })
  status: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', name: 'deleted_at' })
  deletedAt: Date;

  @ManyToOne(() => Course, { nullable: false, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @ManyToOne(() => Cohort, { nullable: false, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'cohort_id' })
  cohort: Cohort;
}

