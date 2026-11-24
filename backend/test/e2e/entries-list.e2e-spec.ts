import { createCategory, createEntry } from '../factories/finance';
import { createTestApp, type TestApp } from '../setup/app';
import { as, loginAs, type SignedIn } from '../setup/auth';

describe('GET /entries and /entries/:id (B6-06)', () => {
  let t: TestApp;
  let finance: SignedIn;
  let income: string;
  let expense: string;
  const project = `Projet-${Date.now()}`;
  beforeAll(async () => {
    t = await createTestApp();
    finance = await loginAs(t, 'FINANCE');
    income = (await createCategory(t.dataSource, 'INCOME')).id;
    expense = (await createCategory(t.dataSource, 'EXPENSE')).id;
    const v = { status: 'VALIDATED' as const, validatedAt: new Date(), project };
    await createEntry(t.dataSource, { ...v, categoryId: income, amountCents: 10_000, entryDate: '2026-10-05', paymentMethod: 'CHEQUE' });
    await createEntry(t.dataSource, { ...v, categoryId: income, amountCents: 2_550, entryDate: '2026-10-20', paymentMethod: 'CASH' });
    await createEntry(t.dataSource, { ...v, direction: 'EXPENSE', categoryId: expense, amountCents: 4_000, entryDate: '2026-10-12', paymentMethod: 'CARD', supplier: 'Métro' });
    await createEntry(t.dataSource, { categoryId: income, amountCents: 999, entryDate: '2026-11-02', project });
  });
  afterAll(() => t.app.close());

  it('returns the page and the totals of the whole selection', async () => {
    const res = await as(t, finance).get('/entries').query({ project, pageSize: 2 }).expect(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.total).toBe(4);
    expect(res.body.totals).toEqual({ count: 4, incomeCents: 13_549, expenseCents: 4_000, balanceCents: 9_549 });
    expect(res.body.items[0].entryDate).toBe('2026-11-02');
  });

  it('filters by period, direction, status, payment method and category', async () => {
    const october = await as(t, finance).get('/entries').query({ project, from: '2026-10-01', to: '2026-10-31' }).expect(200);
    expect(october.body.totals.count).toBe(3);
    const validatedIncome = await as(t, finance).get('/entries').query({ project, direction: 'INCOME', status: 'VALIDATED' }).expect(200);
    expect(validatedIncome.body.totals).toMatchObject({ count: 2, incomeCents: 12_550, expenseCents: 0 });
    const cash = await as(t, finance).get('/entries').query({ project, paymentMethod: 'CASH' }).expect(200);
    expect(cash.body.items.map((e: { amountCents: number }) => e.amountCents)).toEqual([999, 2_550]);
    const byCategory = await as(t, finance).get('/entries').query({ categoryId: expense }).expect(200);
    expect(byCategory.body.items[0]).toMatchObject({ supplier: 'Métro', direction: 'EXPENSE' });
    const search = await as(t, finance).get('/entries').query({ q: 'métro' }).expect(200);
    expect(search.body.total).toBeGreaterThanOrEqual(1);
    await as(t, finance).get('/entries').query({ from: '2026-12-01', to: '2026-01-01' }).expect(422);
  });

  it('sorts by amount on request', async () => {
    const res = await as(t, finance).get('/entries').query({ project, sort: 'amount', order: 'desc' }).expect(200);
    expect(res.body.items.map((e: { amountCents: number }) => e.amountCents)).toEqual([10_000, 4_000, 2_550, 999]);
  });

  it('shows one entry with its history', async () => {
    const created = await as(t, finance)
      .post('/entries')
      .send({ amountCents: 5000, entryDate: '2026-11-01', categoryId: income, paymentMethod: 'CASH', description: 'Vente de livres' })
      .expect(201);
    const res = await as(t, finance).get(`/entries/${created.body.id}`).expect(200);
    expect(res.body).toMatchObject({ reference: created.body.reference, reversedBy: null, attachment: null });
    expect(res.body.history).toEqual([expect.objectContaining({ action: 'ENTRY_CREATED', actor: { id: finance.user.id, name: expect.any(String) } })]);
    await as(t, finance).get('/entries/00000000-0000-4000-8000-000000000000').expect(404);
  });
});
