import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { TOKEN_PURPOSES, type TokenPurpose } from './enums';

@Entity({ schema: 'app', name: 'password_tokens' })
export class PasswordToken {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'user_id', type: 'uuid' }) userId!: string;
  @Column({ name: 'token_hash' }) tokenHash!: string;
  @Column({ type: 'enum', enum: TOKEN_PURPOSES, enumName: 'token_purpose' }) purpose!: TokenPurpose;
  @Column({ name: 'expires_at', type: 'timestamptz' }) expiresAt!: Date;
  @Column({ name: 'used_at', type: 'timestamptz', nullable: true }) usedAt!: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
}
