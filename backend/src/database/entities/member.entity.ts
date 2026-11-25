import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { Consent } from './consent.entity';
import { AGE_CATEGORIES, type AgeCategory, SEXES, type Sex } from './enums';

@Entity({ schema: 'app', name: 'members' })
export class Member {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'member_number', insert: false, update: false }) memberNumber!: string;
  @Column({ name: 'first_name' }) firstName!: string;
  @Column({ name: 'last_name' }) lastName!: string;
  @Column() email!: string;
  @Column({ type: 'text', nullable: true }) phone!: string | null;
  @Column({ type: 'text', nullable: true }) address!: string | null;
  @Column({ name: 'age_category', type: 'enum', enum: AGE_CATEGORIES, enumName: 'age_category' }) ageCategory!: AgeCategory;
  @Column({ type: 'enum', enum: SEXES, enumName: 'sex', nullable: true }) sex!: Sex | null;
  @Column({ name: 'birth_date', type: 'date', nullable: true }) birthDate!: string | null;
  @Column({ default: true }) active!: boolean;
  @Column({ name: 'joined_at', type: 'timestamptz', insert: false }) joinedAt!: Date;
  @Column({ name: 'anonymized_at', type: 'timestamptz', nullable: true }) anonymizedAt!: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
  @OneToMany(() => Consent, (consent) => consent.member) consents?: Consent[];
}
