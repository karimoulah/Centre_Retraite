import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { Contributor } from './contributor.entity';
import { Entry } from './entry.entity';
import { PAYMENT_STATUSES, type PaymentStatus } from './enums';

const cents = { to: (v: number) => v, from: (v: string) => Number(v) };

@Entity({ schema: 'app', name: 'payments' })
export class Payment {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() provider!: string;
  @Column({ type: 'enum', enum: PAYMENT_STATUSES, enumName: 'payment_status', default: 'PENDING' }) status!: PaymentStatus;
  @Column({ name: 'amount_cents', type: 'bigint', transformer: cents }) amountCents!: number;
  @Column({ default: 'CAD' }) currency!: string;
  @Column({ name: 'donor_name' }) donorName!: string;
  @Column({ name: 'donor_email' }) donorEmail!: string;
  @Column({ name: 'checkout_session_id', type: 'text', nullable: true }) checkoutSessionId!: string | null;
  @Column({ name: 'payment_intent_id', type: 'text', nullable: true }) paymentIntentId!: string | null;
  @Column({ name: 'contributor_id', type: 'uuid', nullable: true }) contributorId!: string | null;
  @ManyToOne(() => Contributor, { nullable: true }) @JoinColumn({ name: 'contributor_id' }) contributor?: Contributor | null;
  @Column({ name: 'entry_id', type: 'uuid', nullable: true }) entryId!: string | null;
  @ManyToOne(() => Entry, { nullable: true }) @JoinColumn({ name: 'entry_id' }) entry?: Entry | null;
  @Column({ name: 'refund_entry_id', type: 'uuid', nullable: true }) refundEntryId!: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true }) confirmedAt!: Date | null;
  @Column({ name: 'failed_at', type: 'timestamptz', nullable: true }) failedAt!: Date | null;
  @Column({ name: 'refunded_at', type: 'timestamptz', nullable: true }) refundedAt!: Date | null;
}

@Entity({ schema: 'app', name: 'webhook_events' })
export class WebhookEvent {
  @PrimaryColumn() id!: string;
  @Column() provider!: string;
  @Column() type!: string;
  @CreateDateColumn({ name: 'received_at', type: 'timestamptz' }) receivedAt!: Date;
  @Column({ name: 'payment_id', type: 'uuid', nullable: true }) paymentId!: string | null;
}
