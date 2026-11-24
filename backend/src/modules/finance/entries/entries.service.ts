import { Injectable } from '@nestjs/common';

import { AppError, conflict, fieldError, notFound } from '../../../common/app-error';
import { Tx } from '../../../common/transaction/transaction.service';
import { paginate } from '../../../common/pagination';
import { AuditLog, Category, Contributor, Entry, type EntryDirection } from '../../../database/entities';
import { fullName } from '../../users/user.mapper';
import { AuditService } from '../../audit/audit.service';
import type { CreateIncomeDto, ListEntriesQuery, UpdateEntryDto } from './entries.schemas';
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

  /**
   * Filtered list with the totals of the whole selection (not only the page):
   * income, expenses and balance in cents. Reversals are negative, so they cancel their entry.
   */
  async list(query: ListEntriesQuery) {
    const qb = this.tx.repo(Entry).createQueryBuilder('e');
    if (query.from) qb.andWhere('e.entry_date >= :from', { from: query.from });
    if (query.to) qb.andWhere('e.entry_date <= :to', { to: query.to });
    if (query.categoryId) qb.andWhere('e.category_id = :categoryId', { categoryId: query.categoryId });
    if (query.contributorId) qb.andWhere('e.contributor_id = :contributorId', { contributorId: query.contributorId });
    if (query.direction) qb.andWhere('e.direction = :direction', { direction: query.direction });
    if (query.status) qb.andWhere('e.status = :status', { status: query.status });
    if (query.paymentMethod) qb.andWhere('e.payment_method = :paymentMethod', { paymentMethod: query.paymentMethod });
    if (query.project) qb.andWhere('e.project ILIKE :project', { project: `%${query.project}%` });
    if (query.q) qb.andWhere('(e.reference ILIKE :q OR e.description ILIKE :q OR e.supplier ILIKE :q)', { q: `%${query.q}%` });

    const sums = await qb
      .clone()
      .select('count(*)', 'count')
      .addSelect("coalesce(sum(e.amount_cents) FILTER (WHERE e.direction = 'INCOME'), 0)", 'income')
      .addSelect("coalesce(sum(e.amount_cents) FILTER (WHERE e.direction = 'EXPENSE'), 0)", 'expense')
      .getRawOne<{ count: string; income: string; expense: string }>();
    const totals = {
      count: Number(sums?.count ?? 0),
      incomeCents: Number(sums?.income ?? 0),
      expenseCents: Number(sums?.expense ?? 0),
      balanceCents: Number(sums?.income ?? 0) - Number(sums?.expense ?? 0),
    };

    for (const [name, alias] of Object.entries({ category: 'c', contributor: 'k', reverses: 'r', createdBy: 'cb', decidedBy: 'db', validatedBy: 'vb' })) {
      qb.leftJoinAndSelect(`e.${name}`, alias);
    }
    const page = await paginate(
      qb,
      { ...query, q: undefined },
      {
        sortable: { entryDate: 'e.entryDate', reference: 'e.reference', amount: 'e.amountCents', createdAt: 'e.createdAt', status: 'e.status' },
        defaultSort: { key: 'entryDate', order: 'desc' },
      },
      (e) => toEntry(e),
    );
    return { ...page, totals };
  }

  /** Detail: the entry, its reversal (if corrected) and its history from the audit log. */
  async detail(id: string) {
    const entry = await this.find(id);
    const reversedBy = await this.tx.repo(Entry).findOneBy({ reversesId: id });
    const history = await this.tx
      .repo(AuditLog)
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.actor', 'actor')
      .where('a.entity_type = :type AND a.entity_id = :id', { type: 'Entry', id })
      .orderBy('a.id', 'ASC')
      .getMany();
    return {
      ...toEntry(entry, reversedBy),
      history: history.map((h) => ({
        at: h.at.toISOString(),
        action: h.action,
        actor: h.actor ? { id: h.actor.id, name: fullName(h.actor) } : null,
        before: h.before,
        after: h.after,
      })),
    };
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
