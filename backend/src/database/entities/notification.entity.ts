import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { NOTIFICATION_STATUSES, type NotificationStatus } from './enums';

@Entity({ schema: 'app', name: 'notifications' })
export class Notification {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() type!: string;
  @Column() recipient!: string;
  @Column({ type: 'jsonb', default: {} }) data!: Record<string, unknown>;
  @Column({ name: 'unique_key' }) uniqueKey!: string;
  @Column({ type: 'enum', enum: NOTIFICATION_STATUSES, enumName: 'notification_status', default: 'QUEUED' })
  status!: NotificationStatus;
  @Column({ default: 0 }) attempts!: number;
  @Column({ name: 'last_error', type: 'text', nullable: true }) lastError!: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true }) sentAt!: Date | null;
}
