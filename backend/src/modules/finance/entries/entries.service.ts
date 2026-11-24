import { Injectable } from '@nestjs/common';

import { AppError, conflict, fieldError, notFound } from '../../../common/app-error';
import { Tx } from '../../../common/transaction/transaction.service';
import { Category, Contributor, Entry, type EntryDirection } from '../../../database/entities';
import { AuditService } from '../../audit/audit.service';
import type { CreateIncomeDto, UpdateEntryDto } from './entries.schemas';
import { toEntry } from './entry.mapper';

export const ENTRY_RELATIONS = { category: true, contributor: true, reverses: true, createdBy: true, decidedBy: true, validatedBy: true } as const;

/** Audit snapshot of an entry: what matters to an accountant, amounts in cents. */
export const snapshot = (e: Pick<Entry, 'status' | 'amountCents' | 'categoryId' | 'entryDate' | 'description'>) => ({
  status: e.status,
  amountCents: e.amountCents,
  categoryId: e.categoryId,
  entryDate: e.entryDate,
  description: e.description,
});

@Injectable()
export class EntriesService {
  constructor(
    private readonly tx: Tx,
    private readonly audit: AuditService,
  ) {}

  /** New income, always a DRAFT: it counts in the reports only once validated. */
  async createIncome(dto: CreateIncomeDto, userId: string) {
    await this.checkCategory(dto.categoryId, 'INCOME');
    await this.checkContributor(dto.contributorId);
    const repo = this.tx.repo(Entry);
    const saved = await repo.save(repo.create({ ...dto, contributorId: dto.contributorId ?? null, direction: 'INCOME', status: 'DRAFT', createdById: userId }));
    const entry = await this.find(saved.id);
    await this.audit.record({ action: 'ENTRY_CREATED', entityType: 'Entry', entityId: entry.id, entityLabel: entry.reference, after: snapshot(entry) });
    return toEntry(entry);
  }

  /** Drafts only (409 otherwise). An expense above the threshold is re-submitted by ExpensesService. */
  async updateDraft(id: string, dto: UpdateEntryDto, onExpenseChange?: (entry: Entry) => Promise<void>) {
    const entry = await this.lock(id);
    if (entry.status !== 'DRAFT') throw this.notDraft();
    if (dto.categoryId) await this.checkCategory(dto.categoryId, entry.direction);
    if (entry.direction === 'EXPENSE' && dto.contributorId) throw fieldError(422, 'VALIDATION_FAILED', 'contributorId', 'Une dépense n’a pas de contributeur.');
    if (entry.direction === 'INCOME' && dto.supplier) throw fieldError(422, 'VALIDATION_FAILED', 'supplier', 'Une recette n’a pas de fournisseur.');
    await this.checkContributor(dto.contributorId);
    const before = snapshot(entry);
    if (Object.keys(dto).length) await this.tx.repo(Entry).update(id, dto);
    let updated = await this.find(id);
    if (onExpenseChange && updated.direction === 'EXPENSE') {
      await onExpenseChange(updated);
      updated = await this.find(id);
    }
    await this.audit.record({ action: 'ENTRY_UPDATED', entityType: 'Entry', entityId: id, entityLabel: updated.reference, before, after: snapshot(updated) });
    return toEntry(updated);
  }

  async deleteDraft(id: string): Promise<void> {
    const entry = await this.lock(id);
    if (entry.status !== 'DRAFT') throw this.notDraft();
    await this.tx.repo(Entry).delete(id);
    await this.audit.record({ action: 'ENTRY_DELETED', entityType: 'Entry', entityId: id, entityLabel: entry.reference, before: snapshot(entry) });
  }

  async find(id: string): Promise<Entry> {
    const entry = await this.tx.repo(Entry).findOne({ where: { id }, relations: ENTRY_RELATIONS });
    if (!entry) throw notFound('Écriture introuvable.');
    return entry;
  }

  /** Row lock: two people acting on the same entry are served one after the other. */
  async lock(id: string): Promise<Entry> {
    const entry = await this.tx.repo(Entry).createQueryBuilder('e').setLock('pessimistic_write').where('e.id = :id', { id }).getOne();
    if (!entry) throw notFound('Écriture introuvable.');
    return entry;
  }

  /** Active category of the right direction (the database checks the direction too). */
  async checkCategory(id: string, direction: EntryDirection): Promise<Category> {
    const category = await this.tx.repo(Category).findOneBy({ id });
    if (!category) throw fieldError(422, 'VALIDATION_FAILED', 'categoryId', 'Catégorie introuvable.');
    if (category.direction !== direction) {
      throw fieldError(422, 'CATEGORY_DIRECTION_MISMATCH', 'categoryId', direction === 'INCOME' ? 'Choisissez une catégorie de recette.' : 'Choisissez une catégorie de dépense.');
    }
    if (!category.active) throw fieldError(422, 'CATEGORY_INACTIVE', 'categoryId', 'Cette catégorie est désactivée.');
    return category;
  }

  private async checkContributor(id: string | null | undefined) {
    if (id && !(await this.tx.repo(Contributor).existsBy({ id }))) throw fieldError(422, 'VALIDATION_FAILED', 'contributorId', 'Contributeur introuvable.');
  }

  private notDraft(): AppError {
    return conflict('ENTRY_NOT_DRAFT', 'Seul un brouillon peut être modifié ou supprimé.');
  }
}
