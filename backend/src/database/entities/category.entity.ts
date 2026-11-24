import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { ENTRY_DIRECTIONS, type EntryDirection } from './enums';

@Entity({ schema: 'app', name: 'categories' })
export class Category {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() name!: string;
  @Column({ type: 'enum', enum: ENTRY_DIRECTIONS, enumName: 'entry_direction' }) direction!: EntryDirection;
  @Column({ name: 'receipt_eligible', default: false }) receiptEligible!: boolean;
  @Column({ default: true }) active!: boolean;
  @Column({ type: 'text', nullable: true }) code!: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
