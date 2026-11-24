import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { User } from './user.entity';

@Entity({ schema: 'app', name: 'settings' })
export class Setting<T = Record<string, unknown>> {
  @PrimaryColumn() key!: string;
  @Column({ type: 'jsonb' }) value!: T;
  @Column({ name: 'updated_at', type: 'timestamptz', nullable: true }) updatedAt!: Date | null;
  @Column({ name: 'updated_by', type: 'uuid', nullable: true }) updatedById!: string | null;
  @ManyToOne(() => User, { nullable: true }) @JoinColumn({ name: 'updated_by' }) updatedBy?: User | null;
}
