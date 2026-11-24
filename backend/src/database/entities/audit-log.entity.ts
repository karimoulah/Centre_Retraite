import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from './user.entity';

@Entity({ schema: 'app', name: 'audit_logs' })
export class AuditLog {
  @PrimaryGeneratedColumn('identity', { type: 'bigint', generatedIdentity: 'ALWAYS' }) id!: string;
  @Column({ type: 'timestamptz', insert: false }) at!: Date;
  /** Filled by the database from SET LOCAL app.actor_id when not given. */
  @Column({ name: 'actor_id', type: 'uuid', nullable: true, insert: false }) actorId!: string | null;
  @ManyToOne(() => User, { nullable: true }) @JoinColumn({ name: 'actor_id' }) actor?: User | null;
  @Column() action!: string;
  @Column({ name: 'entity_type' }) entityType!: string;
  @Column({ name: 'entity_id' }) entityId!: string;
  @Column({ name: 'entity_label', default: '' }) entityLabel!: string;
  @Column({ type: 'jsonb', nullable: true }) before!: Record<string, unknown> | null;
  @Column({ type: 'jsonb', nullable: true }) after!: Record<string, unknown> | null;
}
