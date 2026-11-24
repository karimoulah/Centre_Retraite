import { Body, Controller, HttpCode, Injectable, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AppError, conflict } from '../../../common/app-error';
import { CurrentUser } from '../../../common/current-user.decorator';
import { Roles } from '../../../common/roles.decorator';
import { Tx } from '../../../common/transaction/transaction.service';
import { UuidParam } from '../../../common/uuid.pipe';
import { Entry, type User } from '../../../database/entities';
import { AuditService } from '../../audit/audit.service';
import { SettingsService } from '../../settings/settings.service';
import { CreateExpenseDto, RejectExpenseDto } from './entries.schemas';
import { EntriesService, snapshot } from './entries.service';
import { toEntry } from './entry.mapper';

/**
 * Expenses (EF-12). Up to the threshold: DRAFT, validated like any entry.
 * Above it: SUBMITTED, then approved or rejected by someone other than the author, then validated.
 */
@Injectable()
export class ExpensesService {
  constructor(
    private readonly tx: Tx,
    private readonly entries: EntriesService,
    private readonly settings: SettingsService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateExpenseDto, userId: string) {
    await this.entries.checkCategory(dto.categoryId, 'EXPENSE');
    const status = (await this.needsApproval(dto.amountCents)) ? 'SUBMITTED' : 'DRAFT';
    const repo = this.tx.repo(Entry);
    const saved = await repo.save(repo.create({ ...dto, direction: 'EXPENSE', status, createdById: userId }));
    const entry = await this.entries.find(saved.id);
    await this.audit.record({ action: 'ENTRY_CREATED', entityType: 'Entry', entityId: entry.id, entityLabel: entry.reference, after: snapshot(entry) });
    if (status === 'SUBMITTED') await this.recordSubmitted(entry);
    return toEntry(entry);
  }

  /** A draft whose amount now exceeds the threshold goes to approval (called after PATCH). */
  async resubmitIfNeeded(entry: Entry) {
    if (entry.status === 'DRAFT' && (await this.needsApproval(entry.amountCents))) {
      await this.tx.repo(Entry).update(entry.id, { status: 'SUBMITTED' });
      await this.recordSubmitted(entry);
    }
  }

  async approve(id: string, user: User) {
    const entry = await this.submitted(id, user);
    await this.tx.repo(Entry).update(id, { status: 'APPROVED', decidedById: user.id, decidedAt: new Date() });
    await this.audit.record({ action: 'EXPENSE_APPROVED', entityType: 'Entry', entityId: id, entityLabel: entry.reference, before: { status: 'SUBMITTED' }, after: { status: 'APPROVED' } });
    return toEntry(await this.entries.find(id));
  }

  async reject(id: string, dto: RejectExpenseDto, user: User) {
    const entry = await this.submitted(id, user);
    await this.tx.repo(Entry).update(id, { status: 'REJECTED', decidedById: user.id, decidedAt: new Date(), rejectionReason: dto.reason });
    await this.audit.record({
      action: 'EXPENSE_REJECTED',
      entityType: 'Entry',
      entityId: id,
      entityLabel: entry.reference,
      before: { status: 'SUBMITTED' },
      after: { status: 'REJECTED', reason: dto.reason },
    });
    return toEntry(await this.entries.find(id));
  }

  async needsApproval(amountCents: number): Promise<boolean> {
    return amountCents > (await this.settings.finance()).expenseApprovalThresholdCents;
  }

  private async recordSubmitted(entry: Entry) {
    const { expenseApprovalThresholdCents } = await this.settings.finance();
    await this.audit.record({
      action: 'EXPENSE_SUBMITTED',
      entityType: 'Entry',
      entityId: entry.id,
      entityLabel: entry.reference,
      after: { status: 'SUBMITTED', amountCents: entry.amountCents, thresholdCents: expenseApprovalThresholdCents },
    });
  }

  /** Locked SUBMITTED expense; the author can never decide on their own expense. */
  private async submitted(id: string, user: User): Promise<Entry> {
    const entry = await this.entries.lock(id);
    if (entry.direction !== 'EXPENSE' || entry.status !== 'SUBMITTED') {
      throw conflict('NOT_AWAITING_APPROVAL', 'Cette dépense n’est pas en attente d’approbation.');
    }
    if (entry.createdById === user.id) {
      throw new AppError(403, 'SELF_APPROVAL', 'Une autre personne doit approuver une dépense que vous avez saisie.');
    }
    return entry;
  }
}

@ApiTags('finance')
@Roles('FINANCE')
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  /** New expense: DRAFT up to the threshold, SUBMITTED above it. */
  @Post()
  create(@Body() body: CreateExpenseDto, @CurrentUser() user: User) {
    return this.expenses.create(body, user.id);
  }

  @HttpCode(200)
  @Post(':id/approve')
  approve(@Param('id', UuidParam) id: string, @CurrentUser() user: User) {
    return this.expenses.approve(id, user);
  }

  @HttpCode(200)
  @Post(':id/reject')
  reject(@Param('id', UuidParam) id: string, @Body() body: RejectExpenseDto, @CurrentUser() user: User) {
    return this.expenses.reject(id, body, user);
  }
}
