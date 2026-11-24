import { Injectable } from '@nestjs/common';

import { Tx } from '../../common/transaction/transaction.service';
import { AuditLog } from '../../database/entities';

export type AuditInput = {
  action: string;
  entityType: string;
  entityId: string;
  entityLabel?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
};

/** Writes one line in the append-only audit log, inside the current transaction (author = app.actor_id). */
@Injectable()
export class AuditService {
  constructor(private readonly tx: Tx) {}

  async record(input: AuditInput): Promise<void> {
    const line = this.tx.repo(AuditLog).create({
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      entityLabel: input.entityLabel ?? '',
      before: input.before ?? null,
      after: input.after ?? null,
    });
    await this.tx.repo(AuditLog).save(line, { reload: false });
  }
}
