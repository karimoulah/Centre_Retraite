import { Body, Controller, HttpCode, Injectable, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { conflict } from '../../../common/app-error';
import { CurrentUser } from '../../../common/current-user.decorator';
import { Roles } from '../../../common/roles.decorator';
import { Tx } from '../../../common/transaction/transaction.service';
import { UuidParam } from '../../../common/uuid.pipe';
import { Entry, type User } from '../../../database/entities';
import { AuditService } from '../../audit/audit.service';
import { ReverseEntryDto } from './entries.schemas';
import { EntriesService, snapshot } from './entries.service';
import { toEntry } from './entry.mapper';
import { ExpensesService } from './expenses';

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });

/**
 * Validation makes an entry final (EF-13, ENF-03); a mistake is then corrected only by a reversal:
 * a new validated entry with the exact opposite amount, once per entry.
 */
@Injectable()
export class ValidationService {
  constructor(
    private readonly tx: Tx,
    private readonly entries: EntriesService,
    private readonly expenses: ExpensesService,
    private readonly audit: AuditService,
  ) {}

  /**
   * DRAFT or APPROVED → VALIDATED. An expense still awaiting approval is refused.
   * A draft expense now above the threshold (threshold lowered since) goes to approval instead.
   */
  async validate(id: string, userId: string | null) {
    const entry = await this.entries.lock(id);
    if (entry.status === 'VALIDATED') throw conflict('ALREADY_VALIDATED', 'Cette écriture est déjà validée.');
    if (entry.status === 'SUBMITTED') throw conflict('APPROVAL_REQUIRED', 'Cette dépense doit d’abord être approuvée par une autre personne.');
    if (entry.status === 'REJECTED') throw conflict('ENTRY_REJECTED', 'Cette dépense a été refusée : elle ne peut pas être validée.');
    if (entry.direction === 'EXPENSE' && entry.status === 'DRAFT' && (await this.expenses.needsApproval(entry.amountCents))) {
      await this.expenses.resubmitIfNeeded(entry);
      return toEntry(await this.entries.find(id));
    }
    await this.tx.repo(Entry).update(id, { status: 'VALIDATED', validatedById: userId, validatedAt: new Date() });
    const validated = await this.entries.find(id);
    await this.audit.record({
      action: 'ENTRY_VALIDATED',
      entityType: 'Entry',
      entityId: id,
      entityLabel: validated.reference,
      before: { status: entry.status },
      after: snapshot(validated),
    });
    return toEntry(validated);
  }

  /** Creates the opposite entry, already validated, and returns it (the screen opens it). */
  async reverse(id: string, reason: string, userId: string | null) {
    const original = await this.entries.lock(id);
    if (original.status !== 'VALIDATED') throw conflict('NOT_VALIDATED', 'Seule une écriture validée se contrepasse ; un brouillon se modifie.');
    if (original.reversesId) throw conflict('CANNOT_REVERSE_REVERSAL', 'Une contrepassation ne se contrepasse pas.');
    if (await this.tx.repo(Entry).existsBy({ reversesId: id })) throw conflict('ALREADY_REVERSED', 'Cette écriture a déjà été contrepassée.');

    const repo = this.tx.repo(Entry);
    const now = new Date();
    const saved = await repo.save(
      repo.create({
        direction: original.direction,
        status: 'VALIDATED',
        amountCents: -original.amountCents,
        entryDate: today(),
        categoryId: original.categoryId,
        contributorId: original.contributorId,
        supplier: original.supplier,
        paymentMethod: original.paymentMethod,
        project: original.project,
        description: `Contrepassation de ${original.reference}`.slice(0, 500),
        source: original.source,
        reversesId: original.id,
        reversalReason: reason,
        createdById: userId,
        validatedById: userId,
        validatedAt: now,
      }),
    );
    const reversal = await this.entries.find(saved.id);
    await this.audit.record({
      action: 'ENTRY_REVERSED',
      entityType: 'Entry',
      entityId: original.id,
      entityLabel: original.reference,
      after: { reversalId: reversal.id, reversalReference: reversal.reference, reason },
    });
    await this.audit.record({
      action: 'ENTRY_CREATED',
      entityType: 'Entry',
      entityId: reversal.id,
      entityLabel: reversal.reference,
      after: { ...snapshot(reversal), reverses: original.reference, reason },
    });
    return toEntry(reversal);
  }
}

@ApiTags('finance')
@Roles('FINANCE')
@Controller('entries')
export class ValidationController {
  constructor(private readonly validation: ValidationService) {}

  /** Final: the entry can no longer be changed or deleted. */
  @HttpCode(200)
  @Post(':id/validate')
  validate(@Param('id', UuidParam) id: string, @CurrentUser() user: User) {
    return this.validation.validate(id, user.id);
  }

  /** 201 with the reversal entry. */
  @Post(':id/reverse')
  reverse(@Param('id', UuidParam) id: string, @Body() body: ReverseEntryDto, @CurrentUser() user: User) {
    return this.validation.reverse(id, body.reason, user.id);
  }
}
