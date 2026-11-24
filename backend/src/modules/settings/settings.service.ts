import { Injectable } from '@nestjs/common';

import { Tx } from '../../common/transaction/transaction.service';
import { Setting } from '../../database/entities';
import { AuditService } from '../audit/audit.service';
import { fullName } from '../users/user.mapper';

export type MembershipSettings = { autoApprove: boolean };
/** Expenses above this amount need the approval of another person (EF-12). Default 500 $. */
export type FinanceSettings = { expenseApprovalThresholdCents: number };
export const DEFAULT_THRESHOLD_CENTS = 50_000;

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

  async finance(): Promise<FinanceSettings> {
    const setting = await this.tx.repo(Setting).findOneBy({ key: 'finance' });
    const value = setting?.value as Partial<FinanceSettings> | undefined;
    return { expenseApprovalThresholdCents: value?.expenseApprovalThresholdCents ?? DEFAULT_THRESHOLD_CENTS };
  }

  async financeView() {
    const setting = await this.tx.repo(Setting).findOne({ where: { key: 'finance' }, relations: { updatedBy: true } });
    return {
      ...(await this.finance()),
      updatedAt: setting?.updatedAt?.toISOString() ?? null,
      updatedBy: setting?.updatedBy ? fullName(setting.updatedBy) : null,
    };
  }

  async setFinance(value: FinanceSettings, actorId: string) {
    const before = await this.finance();
    await this.tx.repo(Setting).upsert({ key: 'finance', value, updatedAt: new Date(), updatedById: actorId }, { conflictPaths: ['key'] });
    await this.audit.record({
      action: 'SETTINGS_UPDATED',
      entityType: 'Settings',
      entityId: 'finance',
      entityLabel: 'Finances',
      before: { ...before },
      after: { ...value },
    });
    return this.financeView();
  }
}
