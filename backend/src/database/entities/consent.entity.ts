import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { CONSENT_CHANNELS, CONSENT_TYPES, type ConsentChannel, type ConsentType } from './enums';
import { Member } from './member.entity';

@Entity({ schema: 'app', name: 'consents' })
export class Consent {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'member_id', type: 'uuid' }) memberId!: string;
  @ManyToOne(() => Member, (member) => member.consents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  member?: Member;
  @Column({ type: 'enum', enum: CONSENT_TYPES, enumName: 'consent_type' }) type!: ConsentType;
  @Column({ type: 'enum', enum: CONSENT_CHANNELS, enumName: 'consent_channel', default: 'ANY' }) channel!: ConsentChannel;
  @Column({ name: 'granted_at', type: 'timestamptz' }) grantedAt!: Date;
  @Column({ name: 'withdrawn_at', type: 'timestamptz', nullable: true }) withdrawnAt!: Date | null;
}
