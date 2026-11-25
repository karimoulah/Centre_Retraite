import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { AGE_CATEGORIES, MEMBERSHIP_STATUSES, type AgeCategory, SEXES, type Sex, type MembershipStatus } from './enums';
import { User } from './user.entity';

@Entity({ schema: 'app', name: 'membership_requests' })
export class MembershipRequest {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'first_name' }) firstName!: string;
  @Column({ name: 'last_name' }) lastName!: string;
  @Column() email!: string;
  @Column({ type: 'text', nullable: true }) phone!: string | null;
  @Column({ type: 'text', nullable: true }) address!: string | null;
  @Column({ name: 'age_category', type: 'enum', enum: AGE_CATEGORIES, enumName: 'age_category' }) ageCategory!: AgeCategory;
  @Column({ type: 'enum', enum: SEXES, enumName: 'sex', nullable: true }) sex!: Sex | null;
  @Column({ name: 'birth_date', type: 'date', nullable: true }) birthDate!: string | null;
  @Column({ name: 'birthday_wishes_consent', default: false }) birthdayWishesConsent!: boolean;
  @Column({ name: 'newsletter_consent', default: false }) newsletterConsent!: boolean;
  @Column({ type: 'enum', enum: MEMBERSHIP_STATUSES, enumName: 'membership_status', default: 'PENDING' })
  status!: MembershipStatus;
  @Column({ name: 'submitted_at', type: 'timestamptz', insert: false }) submittedAt!: Date;
  @Column({ name: 'decided_at', type: 'timestamptz', nullable: true }) decidedAt!: Date | null;
  @Column({ name: 'decided_by', type: 'uuid', nullable: true }) decidedById!: string | null;
  @ManyToOne(() => User, { nullable: true }) @JoinColumn({ name: 'decided_by' }) decidedBy?: User | null;
  @Column({ name: 'decided_automatically', default: false }) decidedAutomatically!: boolean;
  @Column({ name: 'rejection_reason', type: 'text', nullable: true }) rejectionReason!: string | null;
  @Column({ name: 'member_id', type: 'uuid', nullable: true }) memberId!: string | null;
}
