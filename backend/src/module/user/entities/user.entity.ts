import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Student } from './student.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  userId: number;

  @Column({ type: 'varchar', name: 'name' })
  name: string;

  @Column({ type: 'varchar', name: 'email' })
  email: string;

  @Column({ type: 'varchar', name: 'password', nullable: true })
  password: string;

  @Column({ type: 'varchar', name: 'role' })
  role: string;

  @Column({ type: 'boolean', name: 'status', default: true })
  status: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Student, (student) => student.user, { nullable: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  student: Student;
}