import { AuditLog, Entry } from '../../src/database/entities';
import { createCategory, today } from '../factories/finance';
import { createTestApp, type TestApp } from '../setup/app';
import { as, loginAs, type SignedIn } from '../setup/auth';

describe('Expenses and approval threshold (B6-04)', () => {
  let t: TestApp;
  let author: SignedIn;
  let approver: SignedIn;
  let admin: SignedIn;
  let category: string;
  beforeAll(async () => {
    t = await createTestApp();
    author = await loginAs(t, 'FINANCE', { firstName: 'Marc', lastName: 'Tremblay' });
    approver = await loginAs(t, 'FINANCE', { firstName: 'Claire', lastName: 'Bouchard' });
    admin = await loginAs(t, 'ADMIN');
    category = (await createCategory(t.dataSource, 'EXPENSE')).id;
    await as(t, admin).put('/settings/finance').send({ expenseApprovalThresholdCents: 50_000 }).expect(200);
  });
  afterAll(() => t.app.close());

  const expense = (amountCents: number, overrides: Record<string, unknown> = {}) => ({
    amountCents,
    entryDate: today(),
    categoryId: category,
    paymentMethod: 'CARD',
    supplier: 'Bureau en Gros',
    description: 'Cartouches d’encre',
    ...overrides,
  });

  it('exposes the threshold to finance and lets only an administrator change it', async () => {
    const res = await as(t, author).get('/settings/finance').expect(200);
    expect(res.body).toMatchObject({ expenseApprovalThresholdCents: 50_000, updatedBy: expect.any(String) });
    await as(t, author).put('/settings/finance').send({ expenseApprovalThresholdCents: 1 }).expect(403);
    await as(t, admin).put('/settings/finance').send({ expenseApprovalThresholdCents: -1 }).expect(422);
  });

  it('keeps an expense up to the threshold as a DRAFT', async () => {
    const res = await as(t, author).post('/expenses').send(expense(50_000)).expect(201);
    expect(res.body).toMatchObject({ direction: 'EXPENSE', status: 'DRAFT', supplier: 'Bureau en Gros', contributor: null });
  });

  it('sends an expense above the threshold to approval', async () => {
    const res = await as(t, author).post('/expenses').send(expense(50_001)).expect(201);
    expect(res.body.status).toBe('SUBMITTED');
    const audit = await t.dataSource.getRepository(AuditLog).findOneByOrFail({ action: 'EXPENSE_SUBMITTED', entityId: res.body.id });
    expect(audit.after).toMatchObject({ amountCents: 50_001, thresholdCents: 50_000 });
  });

  it('requires a supplier and an expense category', async () => {
    const income = await createCategory(t.dataSource, 'INCOME');
    const res = await as(t, author).post('/expenses').send(expense(1000, { supplier: '' })).expect(422);
    expect(res.body.details).toEqual([expect.objectContaining({ field: 'supplier' })]);
    const wrong = await as(t, author).post('/expenses').send(expense(1000, { categoryId: income.id })).expect(422);
    expect(wrong.body.code).toBe('CATEGORY_DIRECTION_MISMATCH');
  });

  it('a draft raised above the threshold goes to approval', async () => {
    const draft = await as(t, author).post('/expenses').send(expense(10_000)).expect(201);
    const res = await as(t, author).patch(`/entries/${draft.body.id}`).send({ amountCents: 80_000 }).expect(200);
    expect(res.body.status).toBe('SUBMITTED');
  });

  it('the author cannot approve their own expense; another person can', async () => {
    const submitted = await as(t, author).post('/expenses').send(expense(75_000)).expect(201);
    const self = await as(t, author).post(`/expenses/${submitted.body.id}/approve`).expect(403);
    expect(self.body.code).toBe('SELF_APPROVAL');
    const res = await as(t, approver).post(`/expenses/${submitted.body.id}/approve`).expect(200);
    expect(res.body).toMatchObject({ status: 'APPROVED', decidedBy: { name: 'Claire Bouchard' } });
    const again = await as(t, approver).post(`/expenses/${submitted.body.id}/approve`).expect(409);
    expect(again.body.code).toBe('NOT_AWAITING_APPROVAL');
  });

  it('rejects with a reason; a rejected expense is final', async () => {
    const submitted = await as(t, author).post('/expenses').send(expense(90_000)).expect(201);
    await as(t, approver).post(`/expenses/${submitted.body.id}/reject`).send({ reason: 'non' }).expect(422);
    const res = await as(t, approver).post(`/expenses/${submitted.body.id}/reject`).send({ reason: 'Facture manquante' }).expect(200);
    expect(res.body).toMatchObject({ status: 'REJECTED', rejectionReason: 'Facture manquante' });
    await as(t, author).patch(`/entries/${submitted.body.id}`).send({ description: 'x' }).expect(409);
  });

  it('the database refuses an approval by the author', async () => {
    const submitted = await as(t, author).post('/expenses').send(expense(60_000)).expect(201);
    await expect(
      t.dataSource.getRepository(Entry).update(submitted.body.id, { status: 'APPROVED', decidedById: author.user.id, decidedAt: new Date() }),
    ).rejects.toThrow('entries_approver_not_author');
  });
});
