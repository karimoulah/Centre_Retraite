import { Injectable } from '@nestjs/common';

import { Tx } from '../../common/transaction/transaction.service';
import { Setting } from '../../database/entities';
import { AuditService } from '../audit/audit.service';
import { fullName } from '../users/user.mapper';

export type MembershipSettings = { autoApprove: boolean };

/** Settings stored in app.settings, one JSON value per key; every change is recorded. */
@Injectable()
export class SettingsService {
  constructor(
    private readonly tx: Tx,
    private readonly audit: AuditService,
  ) {}

  async membership(): Promise<MembershipSettings> {
    const setting = await this.tx.repo(Setting).findOneBy({ key: 'membership' });
    return { autoApprove: !!(setting?.value as MembershipSettings | undefined)?.autoApprove };
  }

  /** GET /settings/membership: the value, when it last changed and by whom. */
  async membershipView() {
    const setting = await this.tx.repo(Setting).findOne({ where: { key: 'membership' }, relations: { updatedBy: true } });
    return {
      autoApprove: !!(setting?.value as MembershipSettings | undefined)?.autoApprove,
      updatedAt: setting?.updatedAt?.toISOString() ?? null,
      updatedBy: setting?.updatedBy ? fullName(setting.updatedBy) : null,
    };
  }

  async setMembership(value: MembershipSettings, actorId: string) {
    const before = await this.membership();
    await this.tx
      .repo(Setting)
      .upsert({ key: 'membership', value, updatedAt: new Date(), updatedById: actorId }, { conflictPaths: ['key'] });
    await this.audit.record({
      action: 'SETTINGS_UPDATED',
      entityType: 'Settings',
      entityId: 'membership',
      entityLabel: 'Adhésions',
      before: { ...before },
      after: { ...value },
    });
    return this.membershipView();
  }
}
