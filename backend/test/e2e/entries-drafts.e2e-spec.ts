import { AuditLog, Entry } from '../../src/database/entities';
import { createCategory, createEntry, today } from '../factories/finance';
import { createTestApp, type TestApp } from '../setup/app';
import { as, loginAs, type SignedIn } from '../setup/auth';

describe('POST /entries and drafts (B6-03)', () => {
  let t: TestApp;
  let finance: SignedIn;
  let incomeCategory: string;
  beforeAll(async () => {
    t = await createTestApp();
    finance = await loginAs(t, 'FINANCE');
    incomeCategory = (await createCategory(t.dataSource, 'INCOME')).id;
  });
  afterAll(() => t.app.close());

  const income = (overrides: Record<string, unknown> = {}) => ({
    amountCents: 12_550,
    entryDate: today(),
    categoryId: incomeCategory,
    paymentMethod: 'CHEQUE',
    description: 'Cotisation annuelle',
    ...overrides,
  });

  it('creates a DRAFT income with a generated reference, amount in cents', async () => {
    const contributor = await as(t, finance).post('/contributors').send({ name: 'Rita Dumas' }).expect(201);
    const res = await as(t, finance).post('/entries').send(income({ contributorId: contributor.body.id })).expect(201);
    expect(res.body).toMatchObject({
      reference: expect.stringMatching(/^E-\d{4}-\d{5}$/),
      direction: 'INCOME',
      status: 'DRAFT',
      amountCents: 12_550,
      contributor: { name: 'Rita Dumas' },
      createdBy: { id: finance.user.id },
    });
    const other = await as(t, finance).post('/entries').send(income()).expect(201);
    expect(other.body.reference).not.toBe(res.body.reference);
    expect(await t.dataSource.getRepository(AuditLog).countBy({ action: 'ENTRY_CREATED', entityId: res.body.id })).toBe(1);
  });

  it('validates amount, date and payment method', async () => {
    const res = await as(t, finance)
      .post('/entries')
      .send(income({ amountCents: 0, entryDate: '2999-01-01', paymentMethod: 'ONLINE', description: '' }))
      .expect(422);
    expect(res.body.details.map((d: { field: string }) => d.field)).toEqual(
      expect.arrayContaining(['amountCents', 'entryDate', 'paymentMethod', 'description']),
    );
    await as(t, finance).post('/entries').send(income({ amountCents: 12.5 })).expect(422);
  });

  it('refuses an expense category and an inactive category', async () => {
    const expense = await createCategory(t.dataSource, 'EXPENSE');
    const wrong = await as(t, finance).post('/entries').send(income({ categoryId: expense.id })).expect(422);
    expect(wrong.body).toMatchObject({ code: 'CATEGORY_DIRECTION_MISMATCH', details: [{ field: 'categoryId' }] });
    const off = await createCategory(t.dataSource, 'INCOME', { active: false });
    const inactive = await as(t, finance).post('/entries').send(income({ categoryId: off.id })).expect(422);
    expect(inactive.body.code).toBe('CATEGORY_INACTIVE');
  });

  it('edits and deletes a draft, records both', async () => {
    const created = await as(t, finance).post('/entries').send(income()).expect(201);
    const res = await as(t, finance).patch(`/entries/${created.body.id}`).send({ amountCents: 9900, project: 'Fête de Noël' }).expect(200);
    expect(res.body).toMatchObject({ amountCents: 9900, project: 'Fête de Noël' });
    const audit = await t.dataSource.getRepository(AuditLog).findOneByOrFail({ action: 'ENTRY_UPDATED', entityId: created.body.id });
    expect(audit).toMatchObject({ before: { amountCents: 12_550 }, after: { amountCents: 9900 } });
    await as(t, finance).delete(`/entries/${created.body.id}`).expect(204);
    expect(await t.dataSource.getRepository(Entry).existsBy({ id: created.body.id })).toBe(false);
  });

  it('refuses to edit or delete an entry that is no longer a draft', async () => {
    const validated = await createEntry(t.dataSource, { categoryId: incomeCategory, status: 'VALIDATED', validatedAt: new Date() });
    const edit = await as(t, finance).patch(`/entries/${validated.id}`).send({ description: 'Autre' }).expect(409);
    expect(edit.body.code).toBe('ENTRY_NOT_DRAFT');
    await as(t, finance).delete(`/entries/${validated.id}`).expect(409);
  });

  it('the database itself refuses a direction mismatch, a change or a deletion after validation', async () => {
    const repo = t.dataSource.getRepository(Entry);
    const expense = await createCategory(t.dataSource, 'EXPENSE');
    await expect(createEntry(t.dataSource, { categoryId: expense.id, direction: 'INCOME' })).rejects.toThrow('category direction does not match');
    const validated = await createEntry(t.dataSource, { categoryId: incomeCategory, status: 'VALIDATED', validatedAt: new Date() });
    await expect(repo.update(validated.id, { amountCents: 1 })).rejects.toThrow('a validated entry cannot change');
    await expect(repo.delete(validated.id)).rejects.toThrow('only a draft entry can be deleted');
    await expect(createEntry(t.dataSource, { categoryId: incomeCategory, amountCents: -500 })).rejects.toThrow('entries_sign');
  });

  it('is reserved to the finance role', async () => {
    await as(t, await loginAs(t, 'ADMIN')).post('/entries').send(income()).expect(403);
  });
});
