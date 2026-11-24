import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { CONTRIBUTOR_KINDS, type ContributorKind } from './enums';
import { Member } from './member.entity';

@Entity({ schema: 'app', name: 'contributors' })
export class Contributor {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'enum', enum: CONTRIBUTOR_KINDS, enumName: 'contributor_kind', default: 'INDIVIDUAL' }) kind!: ContributorKind;
  @Column() name!: string;
  @Column({ type: 'text', nullable: true }) email!: string | null;
  @Column({ type: 'text', nullable: true }) phone!: string | null;
  @Column({ type: 'text', nullable: true }) address!: string | null;
  @Column({ type: 'text', nullable: true }) notes!: string | null;
  @Column({ name: 'member_id', type: 'uuid', nullable: true }) memberId!: string | null;
  @OneToOne(() => Member, { nullable: true }) @JoinColumn({ name: 'member_id' }) member?: Member | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
