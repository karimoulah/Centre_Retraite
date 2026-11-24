import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { ROLES, type Role } from './enums';
import { User } from './user.entity';

@Entity({ schema: 'app', name: 'user_roles' })
export class UserRole {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' }) userId!: string;
  @PrimaryColumn({ type: 'enum', enum: ROLES, enumName: 'role' }) role!: Role;
  @ManyToOne(() => User, (user) => user.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
