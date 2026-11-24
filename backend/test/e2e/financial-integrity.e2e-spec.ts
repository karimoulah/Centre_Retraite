import { Entry } from '../../src/database/entities';
import { createCategory, createEntry, today } from '../factories/finance';
import { createTestApp, type TestApp } from '../setup/app';
import { as, loginAs, type SignedIn } from '../setup/auth';

/**
 * ENF-03 — financial integrity (problématique 2 of the report). Each rule is checked twice:
 * through the API, and directly against the database, which must refuse it even if the code were wrong.
 */
describe('Financial integrity (B6-14)', () => {
  let t: TestApp;
  let author: SignedIn;
  let colleague: SignedIn;
  let income: string;
  let expense: string;
  const repo = () => t.dataSource.getRepository(Entry);
  beforeAll(async () => {
    t = await createTestApp();
    author = await loginAs(t, 'FINANCE');
    colleague = await loginAs(t, 'FINANCE');
    income = (await createCategory(t.dataSource, 'INCOME')).id;
    expense = (await createCategory(t.dataSource, 'EXPENSE')).id;
    await as(t, await loginAs(t, 'ADMIN')).put('/settings/finance').send({ expenseApprovalThresholdCents: 50_000 }).expect(200);
  });
  afterAll(() => t.app.close());

  const validatedIncome = async (amountCents = 20_000) => {
    const created = await as(t, author)
      .post('/entries')
      .send({ amountCents, entryDate: today(), categoryId: income, paymentMethod: 'TRANSFER', description: 'Subvention municipale' })
      .expect(201);
    await as(t, author).post(`/entries/${created.body.id}/validate`).expect(200);
    return created.body as { id: string; reference: string };
  };

  describe('a validated entry is immutable', () => {
    it('through the API: no edit, no deletion, no receipt change, no second validation', async () => {
      const entry = await validatedIncome();
      await as(t, author).patch(`/entries/${entry.id}`).send({ amountCents: 1 }).expect(409);
      await as(t, author).delete(`/entries/${entry.id}`).expect(409);
      await as(t, author).post(`/entries/${entry.id}/attachment`).send({ fileName: 'a.pdf', contentType: 'application/pdf', size: 10 }).expect(409);
      await as(t, author).post(`/entries/${entry.id}/validate`).expect(409);
      expect(await repo().findOneByOrFail({ id: entry.id })).toMatchObject({ amountCents: 20_000, status: 'VALIDATED' });
    });

    it('in the database: every column update and the deletion are refused', async () => {
      const entry = await validatedIncome();
      for (const change of [{ amountCents: 1 }, { description: 'x' }, { entryDate: '2020-01-01' }, { status: 'DRAFT' as const }, { attachmentKey: 'k' }]) {
        await expect(repo().update(entry.id, change)).rejects.toThrow('a validated entry cannot change');
      }
      await expect(repo().delete(entry.id)).rejects.toThrow('only a draft entry can be deleted');
    });

    it('two simultaneous validations: one succeeds, the other gets 409', async () => {
      const created = await as(t, author)
        .post('/entries')
        .send({ amountCents: 500, entryDate: today(), categoryId: income, paymentMethod: 'CASH', description: 'Café' })
        .expect(201);
      const results = await Promise.all([as(t, author).post(`/entries/${created.body.id}/validate`), as(t, colleague).post(`/entries/${created.body.id}/validate`)]);
      expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    });
  });

  describe('a reversal is unique and exact', () => {
    it('the reversal is the exact opposite and brings the net balance back to zero', async () => {
      const entry = await validatedIncome(98_765);
      const reversal = await as(t, author).post(`/entries/${entry.id}/reverse`).send({ reason: 'Montant saisi deux fois' }).expect(201);
      expect(reversal.body.amountCents).toBe(-98_765);
      const sum = await t.dataSource.query(`SELECT sum(amount_cents)::int AS net FROM app.entries WHERE id = $1 OR reverses_id = $1`, [entry.id]);
      expect(sum[0].net).toBe(0);
    });

    it('two simultaneous reversals: exactly one is created', async () => {
      const entry = await validatedIncome();
      const results = await Promise.all([
        as(t, author).post(`/entries/${entry.id}/reverse`).send({ reason: 'Erreur de montant' }),
        as(t, colleague).post(`/entries/${entry.id}/reverse`).send({ reason: 'Erreur de montant' }),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
      expect(await repo().countBy({ reversesId: entry.id })).toBe(1);
    });

    it('in the database: a second reversal, a wrong amount or the reversal of a draft are refused', async () => {
      const entry = await validatedIncome(10_000);
      const base = { direction: 'INCOME' as const, categoryId: income, status: 'VALIDATED' as const, validatedAt: new Date(), reversalReason: 'Correction manuelle' };
      await expect(createEntry(t.dataSource, { ...base, reversesId: entry.id, amountCents: -9_999 })).rejects.toThrow('exact opposite');
      await createEntry(t.dataSource, { ...base, reversesId: entry.id, amountCents: -10_000 });
      await expect(createEntry(t.dataSource, { ...base, reversesId: entry.id, amountCents: -10_000 })).rejects.toThrow('entries_reverses_id_key');
      const draft = await createEntry(t.dataSource, { categoryId: income });
      await expect(createEntry(t.dataSource, { ...base, reversesId: draft.id, amountCents: -2_500 })).rejects.toThrow('exact opposite');
    });
  });

  describe('a category is used in its direction only', () => {
    it('through the API and in the database', async () => {
      const res = await as(t, author)
        .post('/expenses')
        .send({ amountCents: 1000, entryDate: today(), categoryId: income, paymentMethod: 'CASH', supplier: 'X', description: 'Mauvais sens' })
        .expect(422);
      expect(res.body.code).toBe('CATEGORY_DIRECTION_MISMATCH');
      await expect(createEntry(t.dataSource, { direction: 'EXPENSE', categoryId: income })).rejects.toThrow('category direction does not match');
      const draft = await createEntry(t.dataSource, { categoryId: income });
      await expect(repo().update(draft.id, { categoryId: expense })).rejects.toThrow('category direction does not match');
    });
  });

  describe('the approver is not the author', () => {
    it('through the API and in the database', async () => {
      const submitted = await as(t, author)
        .post('/expenses')
        .send({ amountCents: 120_000, entryDate: today(), categoryId: expense, paymentMethod: 'CHEQUE', supplier: 'Traiteur', description: 'Repas de Noël' })
        .expect(201);
      expect(submitted.body.status).toBe('SUBMITTED');
      await as(t, author).post(`/expenses/${submitted.body.id}/approve`).expect(403);
      await expect(repo().update(submitted.body.id, { status: 'APPROVED', decidedById: author.user.id, decidedAt: new Date() })).rejects.toThrow(
        'entries_approver_not_author',
      );
      await as(t, colleague).post(`/expenses/${submitted.body.id}/approve`).expect(200);
    });

    it('an expense above the threshold cannot be validated without approval', async () => {
      const submitted = await as(t, author)
        .post('/expenses')
        .send({ amountCents: 50_001, entryDate: today(), categoryId: expense, paymentMethod: 'CARD', supplier: 'Location', description: 'Autobus' })
        .expect(201);
      await repo().update(submitted.body.id, { attachmentKey: `entries/${submitted.body.id}/f.pdf`, attachmentName: 'f.pdf' });
      const res = await as(t, author).post(`/entries/${submitted.body.id}/validate`).expect(409);
      expect(res.body.code).toBe('APPROVAL_REQUIRED');
    });
  });
});
