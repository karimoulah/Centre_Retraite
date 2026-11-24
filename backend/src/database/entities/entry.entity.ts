import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { Category } from './category.entity';
import { Contributor } from './contributor.entity';
import {
  ENTRY_DIRECTIONS,
  ENTRY_SOURCES,
  ENTRY_STATUSES,
  type EntryDirection,
  type EntrySource,
  type EntryStatus,
  PAYMENT_METHODS,
  type PaymentMethod,
} from './enums';
import { User } from './user.entity';

/** bigint ↔ number: amounts stay far below 2^53 cents. */
const cents = { to: (v: number) => v, from: (v: string | null) => (v === null ? null : Number(v)) };

@Entity({ schema: 'app', name: 'entries' })
export class Entry {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ insert: false, update: false }) reference!: string;
  @Column({ type: 'enum', enum: ENTRY_DIRECTIONS, enumName: 'entry_direction' }) direction!: EntryDirection;
  @Column({ type: 'enum', enum: ENTRY_STATUSES, enumName: 'entry_status', default: 'DRAFT' }) status!: EntryStatus;
  @Column({ name: 'amount_cents', type: 'bigint', transformer: cents }) amountCents!: number;
  @Column({ name: 'entry_date', type: 'date' }) entryDate!: string;
  @Column({ name: 'category_id', type: 'uuid' }) categoryId!: string;
  @ManyToOne(() => Category) @JoinColumn({ name: 'category_id' }) category?: Category;
  @Column({ name: 'contributor_id', type: 'uuid', nullable: true }) contributorId!: string | null;
  @ManyToOne(() => Contributor, { nullable: true }) @JoinColumn({ name: 'contributor_id' }) contributor?: Contributor | null;
  @Column({ type: 'text', nullable: true }) supplier!: string | null;
  @Column({ name: 'payment_method', type: 'enum', enum: PAYMENT_METHODS, enumName: 'payment_method' }) paymentMethod!: PaymentMethod;
  @Column({ type: 'text', nullable: true }) project!: string | null;
  @Column() description!: string;
  @Column({ type: 'enum', enum: ENTRY_SOURCES, enumName: 'entry_source', default: 'MANUAL' }) source!: EntrySource;
  @Column({ name: 'attachment_key', type: 'text', nullable: true }) attachmentKey!: string | null;
  @Column({ name: 'attachment_name', type: 'text', nullable: true }) attachmentName!: string | null;
  @Column({ name: 'attachment_type', type: 'text', nullable: true }) attachmentType!: string | null;
  @Column({ name: 'attachment_size', type: 'integer', nullable: true }) attachmentSize!: number | null;
  @Column({ name: 'reverses_id', type: 'uuid', nullable: true }) reversesId!: string | null;
  @OneToOne(() => Entry, { nullable: true }) @JoinColumn({ name: 'reverses_id' }) reverses?: Entry | null;
  @Column({ name: 'reversal_reason', type: 'text', nullable: true }) reversalReason!: string | null;
  @Column({ name: 'created_by', type: 'uuid', nullable: true }) createdById!: string | null;
  @ManyToOne(() => User, { nullable: true }) @JoinColumn({ name: 'created_by' }) createdBy?: User | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
  @Column({ name: 'decided_by', type: 'uuid', nullable: true }) decidedById!: string | null;
  @ManyToOne(() => User, { nullable: true }) @JoinColumn({ name: 'decided_by' }) decidedBy?: User | null;
  @Column({ name: 'decided_at', type: 'timestamptz', nullable: true }) decidedAt!: Date | null;
  @Column({ name: 'rejection_reason', type: 'text', nullable: true }) rejectionReason!: string | null;
  @Column({ name: 'validated_by', type: 'uuid', nullable: true }) validatedById!: string | null;
  @ManyToOne(() => User, { nullable: true }) @JoinColumn({ name: 'validated_by' }) validatedBy?: User | null;
  @Column({ name: 'validated_at', type: 'timestamptz', nullable: true }) validatedAt!: Date | null;
}
