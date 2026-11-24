import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import type { Role } from './enums';
import { Member } from './member.entity';
import { UserRole } from './user-role.entity';

@Entity({ schema: 'app', name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() email!: string;
  @Column({ name: 'password_hash', type: 'text', nullable: true, select: false }) passwordHash!: string | null;
  @Column({ name: 'first_name' }) firstName!: string;
  @Column({ name: 'last_name' }) lastName!: string;
  @Column({ default: true }) active!: boolean;
  @Column({ name: 'failed_attempts', default: 0 }) failedAttempts!: number;
  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true }) lockedUntil!: Date | null;
  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true }) lastLoginAt!: Date | null;
  @Column({ name: 'member_id', type: 'uuid', nullable: true }) memberId!: string | null;
  @OneToOne(() => Member, { nullable: true }) @JoinColumn({ name: 'member_id' }) member?: Member | null;
  @OneToMany(() => UserRole, (role) => role.user, { cascade: true, eager: true }) userRoles!: UserRole[];
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;

  get roles(): Role[] {
    return (this.userRoles ?? []).map((r) => r.role).sort();
  }
}
